const fs = require('fs');
const { execSync } = require('child_process');

try {
    const serviceAccountContent = fs.readFileSync('service-account.json', 'utf8');
    // Validate JSON
    JSON.parse(serviceAccountContent);

    // Minify for Env Var
    const serviceAccountJson = JSON.stringify(JSON.parse(serviceAccountContent));

    console.log('Configuring Vercel Environment Variables...');

    const addEnv = (key, value) => {
        try {
            console.log(`Removing ${key}...`);
            execSync(`npx vercel env rm ${key} production -y`, { stdio: 'inherit' });
        } catch (e) { }

        console.log(`Adding ${key}...`);

        const tempFile = `temp_${key}.txt`;
        fs.writeFileSync(tempFile, value);

        try {
            execSync(`type ${tempFile} | npx vercel env add ${key} production`, { stdio: 'inherit' });
            console.log(`Successfully added ${key}`);
        } catch (error) {
            console.error(`Failed to add ${key}`);
        } finally {
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        }
    };

    addEnv('GOOGLE_SERVICE_ACCOUNT_JSON', serviceAccountJson);

    const serviceAccount = JSON.parse(serviceAccountContent);
    addEnv('GOOGLE_SPREADSHEET_ID', process.env.GOOGLE_SPREADSHEET_ID || "1inj9Rsm8wwa5tC1LIxFUUaXnSseRvbi_dyYNYEJmIlA");
    addEnv('GOOGLE_DRIVE_FOLDER_ID', "1R4z98vXcsBzaprY3yksXt7g0mwOari-s");
    addEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL', serviceAccount.client_email);

    console.log('Environment variables updated successfully.');

} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
