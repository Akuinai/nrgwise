## NrgWise Coach - Praktijkopdracht

### 🛠️  Installatie  

1. Clone deze repository
```
   git clone git@github.com:Akuinai/nrgwise.git
```

2. Navigeer naar de server folder
``` 
cd server
```
3. Installeer de packages via npm
``` 
npm install
```
4. Maak een .env bestand aan in de server/folder met daarin de volgende eigen API variabelen
``` 
AZURE_OPENAI_API_KEY=je-openai-api-key
AZURE_OPENAI_API_VERSION=je-openai-api-versie
AZURE_OPENAI_API_INSTANCE_NAME=je-openai-instance-naam
AZURE_OPENAI_API_DEPLOYMENT_NAME=je-openai-deployment-naam
AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME=je-openai-embedding-deployment-naam
```
5. Start de server
```
   npm run dev
```
6. Open het bestand index.html dat zich bevindt in de client folder, via liveserver of klik op run 

### Functionaliteit van webapplicatie
	•	Upload één of meerdere PDF-documenten, bijvoorbeeld energierapporten
	•	Als er een PDF wordt geupload, haalt de server automatisch de inhoud eruit. Zodat de AI later kan zoeken in die tekst om goede antwoorden te geven
	•	Met Azure OpenAI worden embeddings gemaakt en opgeslagen in een FAISS vectorstore
	•	De gebruiker kan via de client vragen stellen over zijn eigen documenten
	•	De server zoekt relevante stukken tekst en laat Azure OpenAI een antwoord genereren








