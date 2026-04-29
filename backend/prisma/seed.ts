import { PrismaClient, Role, DifficultyLevel, Severity } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@netsuite.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@netsuite.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Create consultant user
  const consultantPassword = await bcrypt.hash('consul123', 10);
  const consultant = await prisma.user.upsert({
    where: { email: 'consultant@netsuite.com' },
    update: {},
    create: {
      name: 'Consultor NetSuite',
      email: 'consultant@netsuite.com',
      password: consultantPassword,
      role: Role.CONSULTANT,
    },
  });

  // Create tags
  const tagNames = [
    'suitescript', 'workflow', 'saved-search', 'csv-import',
    'user-role', 'permissions', 'custom-record', 'suitelet',
    'restlet', 'map-reduce', 'client-script', 'user-event',
    'scheduled-script', 'mass-update', 'financial', 'inventory',
    'order-management', 'crm', 'customization', 'integration',
  ];

  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      }),
    ),
  );

  // Create sample errors
  const sampleErrors = [
    {
      title: 'SSS_MISSING_REQD_ARGUMENT - Record type not specified',
      description: 'Error when trying to load a record without specifying the record type parameter.',
      rootCause: 'The record.load() function requires both type and id parameters. Missing the type parameter causes this error.',
      solution: 'Ensure you pass both type and id to record.load():\n\nvar rec = record.load({ type: record.Type.SALES_ORDER, id: recordId });',
      netsuitePath: 'Customization > Scripting > Scripts',
      howToTest: 'Run the script in the debugger and verify the record loads correctly.',
      postValidation: 'Check the execution log for successful record load.',
      difficultyLevel: DifficultyLevel.BASIC,
      severity: Severity.MEDIUM,
      tags: ['suitescript', 'client-script'],
    },
    {
      title: 'INSUFFICIENT_PERMISSION - You do not have permission to access this page',
      description: 'User reports they cannot access a specific page or record in NetSuite.',
      rootCause: 'The user role does not have the required permissions for the page or record type.',
      solution: '1. Go to Setup > Users/Roles > Manage Roles\n2. Find the user role\n3. Add the missing permission\n4. Save and have the user log out and back in.',
      netsuitePath: 'Setup > Users/Roles > Manage Roles',
      howToTest: 'Log in as the affected user and try to access the page.',
      postValidation: 'Confirm the user can now access the page without errors.',
      difficultyLevel: DifficultyLevel.BASIC,
      severity: Severity.MEDIUM,
      tags: ['permissions', 'user-role'],
    },
    {
      title: 'SSS_INVALID_SRCH_FILTER - Invalid search filter expression',
      description: 'Saved search throws an error when using certain filter combinations.',
      rootCause: 'The search filter uses an invalid operator for the field type, or the filter value format is incorrect.',
      solution: '1. Review the filter expression\n2. Verify the operator is valid for the field type\n3. Check that date fields use the correct format\n4. Use search.createFilter() for complex filters.',
      netsuitePath: 'Lists > Search > Saved Searches',
      difficultyLevel: DifficultyLevel.INTERMEDIATE,
      severity: Severity.MEDIUM,
      tags: ['saved-search', 'suitescript'],
    },
    {
      title: 'MAP_REDUCE_SCRIPT - SSS_USAGE_LIMIT_EXCEEDED',
      description: 'Map/Reduce script exceeds governance limits and fails mid-execution.',
      rootCause: 'The script consumes too many governance units in a single invocation. Each API call has a unit cost.',
      solution: '1. Check remaining governance with runtime.getCurrentScript().getRemainingUsage()\n2. Yield in the map/reduce stages to reset governance\n3. Batch operations to reduce API calls\n4. Use N/query instead of N/search for large datasets.',
      netsuitePath: 'Customization > Scripting > Script Deployments',
      howToTest: 'Deploy the script and monitor the execution log for governance usage.',
      postValidation: 'Verify the script completes all stages without hitting limits.',
      difficultyLevel: DifficultyLevel.ADVANCED,
      severity: Severity.CRITICAL,
      tags: ['map-reduce', 'suitescript'],
    },
    {
      title: 'CSV Import - INVALID_FLD_VALUE for date fields',
      description: 'CSV import fails with INVALID_FLD_VALUE when importing date fields.',
      rootCause: 'The date format in the CSV does not match the company date format preferences in NetSuite.',
      solution: '1. Go to Setup > Company > General Preferences\n2. Check the date format setting\n3. Ensure CSV dates match that exact format\n4. For US format use MM/DD/YYYY, for BR use DD/MM/YYYY.',
      netsuitePath: 'Setup > Import/Export > Import CSV Records',
      howToTest: 'Import a small test CSV with corrected date formats.',
      difficultyLevel: DifficultyLevel.BASIC,
      severity: Severity.LOW,
      tags: ['csv-import'],
    },
  ];

  for (const errorData of sampleErrors) {
    const { tags: tagNames, ...data } = errorData;
    const error = await prisma.netsuiteError.create({
      data: {
        ...data,
        createdBy: consultant.id,
        tags: {
          create: await Promise.all(
            tagNames.map(async (name) => {
              const tag = await prisma.tag.findUnique({ where: { name } });
              return { tagId: tag!.id };
            }),
          ),
        },
      },
    });
    console.log(`Created error: ${error.title}`);
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
