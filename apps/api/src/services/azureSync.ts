import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Initialize Azure AD client
function getGraphClient() {
  const credential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID!,
    process.env.AZURE_CLIENT_ID!,
    process.env.AZURE_CLIENT_SECRET!
  );

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken(['https://graph.microsoft.com/.default']);
        return token.token;
      },
    },
  });
}

// Map Azure AD groups to roles
function mapAzureGroupToRole(groupIds: string[]): string {
  const adminGroupId = process.env.AZURE_GROUP_ADMIN;
  const managerGroupId = process.env.AZURE_GROUP_MANAGER;
  
  if (groupIds.includes(adminGroupId!)) return 'ADMIN';
  if (groupIds.includes(managerGroupId!)) return 'MANAGER';
  return 'EMPLOYEE';
}

interface AzureUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string;
  jobTitle?: string;
  department?: string;
}

interface UserWithGroups extends AzureUser {
  groupIds: string[];
}

/**
 * Sync Azure AD users to GoalFlow database
 */
export async function syncAzureADUsers() {
  try {
    console.log('🔄 Starting Azure AD sync...');
    const client = getGraphClient();

    // Fetch all users from Azure AD
    const response = await client
      .api('/users')
      .select(['id', 'displayName', 'userPrincipalName', 'mail', 'jobTitle', 'department'])
      .top(999)
      .get();

    const azureUsers: AzureUser[] = response.value;
    console.log(`📊 Found ${azureUsers.length} users in Azure AD`);

    // For each user, get their group memberships
    let syncedCount = 0;
    for (const azureUser of azureUsers) {
      try {
        // Get user's group membership
        const groupsResponse = await client
          .api(`/users/${azureUser.id}/memberOf`)
          .get();

        const groupIds = groupsResponse.value
          .filter((item: any) => item['@odata.type'] === '#microsoft.graph.group')
          .map((group: any) => group.id);

        const role = mapAzureGroupToRole(groupIds);
        const email = azureUser.mail || azureUser.userPrincipalName;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          // Update role if changed
          if (existingUser.role !== role) {
            await prisma.user.update({
              where: { email },
              data: { role },
            });
            console.log(`✏️  Updated ${email} role to ${role}`);
          }
        } else {
          // Create new user with temporary password
          const tempPassword = generateTemporaryPassword();
          const passwordHash = await bcrypt.hash(tempPassword, 10);

          await prisma.user.create({
            data: {
              name: azureUser.displayName,
              email,
              passwordHash,
              role,
            },
          });

          console.log(`✅ Created ${email} (${role})`);
          syncedCount++;
        }
      } catch (userError) {
        console.error(`❌ Error syncing user ${azureUser.userPrincipalName}:`, userError);
      }
    }

    console.log(`\n✨ Sync complete! ${syncedCount} new users created`);
    return { success: true, synced: syncedCount, total: azureUsers.length };
  } catch (error) {
    console.error('❌ Azure AD sync failed:', error);
    throw error;
  }
}

/**
 * Generate a secure temporary password
 */
function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Sync specific Azure AD group members as a particular role
 */
export async function syncAzureGroupByRole(groupId: string, role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE') {
  try {
    console.log(`🔄 Syncing ${role} group from Azure AD...`);
    const client = getGraphClient();

    // Get all members of the group
    const response = await client
      .api(`/groups/${groupId}/members`)
      .select(['id', 'displayName', 'userPrincipalName', 'mail'])
      .top(999)
      .get();

    const groupMembers: AzureUser[] = response.value.filter(
      (item: any) => item['@odata.type'] === '#microsoft.graph.user'
    );

    console.log(`📊 Found ${groupMembers.length} ${role} members`);

    let syncedCount = 0;
    for (const member of groupMembers) {
      try {
        const email = member.mail || member.userPrincipalName;

        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          if (existingUser.role !== role) {
            await prisma.user.update({
              where: { email },
              data: { role },
            });
            console.log(`✏️  Updated ${email} to ${role}`);
          }
        } else {
          const tempPassword = generateTemporaryPassword();
          const passwordHash = await bcrypt.hash(tempPassword, 10);

          await prisma.user.create({
            data: {
              name: member.displayName,
              email,
              passwordHash,
              role,
            },
          });

          console.log(`✅ Created ${email} as ${role}`);
          syncedCount++;
        }
      } catch (userError) {
        console.error(`❌ Error syncing member ${member.userPrincipalName}:`, userError);
      }
    }

    console.log(`\n✨ ${role} sync complete! ${syncedCount} new users created`);
    return { success: true, synced: syncedCount, role };
  } catch (error) {
    console.error(`❌ Azure AD ${role} sync failed:`, error);
    throw error;
  }
}
