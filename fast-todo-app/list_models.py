from google import genai

client = genai.Client(api_key="AIzaSyAQKj05tS11VIrkrhibnsT0-bUlMmZ2JDQ")
for model in client.models.list():
    print(model.name)
