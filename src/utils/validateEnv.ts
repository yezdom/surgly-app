export function validateEnvironment() {
  const requiredUrl = 'https://hiefmgtlazspyhspzbjl.supabase.co';
  const currentUrl = import.meta.env.VITE_SUPABASE_URL;

  if (currentUrl !== requiredUrl) {
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('🚨 CRITICAL ERROR: Wrong Supabase database detected!');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('Expected:', requiredUrl);
    console.error('Current:', currentUrl);
    console.error('');
    console.error('⚠️  Authentication will FAIL - user accounts are in hiefmgtlazspyhspzbjl');
    console.error('⚠️  Check .env file - it may have reverted to xsxabdojiokotjpofnlx');
    console.error('═══════════════════════════════════════════════════════════════');

    throw new Error(
      'Configuration error: Wrong database detected. Please contact support.'
    );
  }

  console.log('✅ Environment validation passed: hiefmgtlazspyhspzbjl');
}
