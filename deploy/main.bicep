# Azure deployment architecture – Bicep template (skeleton)

@description('Location for all resources')
param location string = resourceGroup().location

@description('App name prefix')
param appPrefix string = 'hydmarketplace'

# ── Backend: Azure App Service ──────────────────────────────────────────────

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${appPrefix}-plan'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource backendApp 'Microsoft.Web/sites@2023-01-01' = {
  name: '${appPrefix}-api'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'PYTHON|3.12'
      appCommandLine: 'uvicorn app.main:app --host 0.0.0.0 --port 8000'
      appSettings: [
        { name: 'AZURE_OPENAI_ENDPOINT', value: '' }
        { name: 'AZURE_OPENAI_KEY', value: '' }
        { name: 'AZURE_OPENAI_DEPLOYMENT', value: 'gpt-4o' }
        { name: 'CORS_ORIGINS', value: 'https://${appPrefix}.azurestaticapps.net' }
      ]
    }
  }
}

# ── Frontend: Azure Static Web Apps ─────────────────────────────────────────

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: appPrefix
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    buildProperties: {
      appLocation: 'frontend'
      outputLocation: 'dist'
    }
  }
}

# ── Azure OpenAI ────────────────────────────────────────────────────────────

resource openAI 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: '${appPrefix}-openai'
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {}
}

output backendUrl string = 'https://${backendApp.properties.defaultHostName}'
output frontendUrl string = 'https://${staticWebApp.properties.defaultHostname}'
