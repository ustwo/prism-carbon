from openai import OpenAI

# The client gets the API key from the environment variable `OPENAI_API_KEY`.
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {
            "role": "user",
            "content": "Explain how AI works in a few words"
        }
    ]
)
print(response.choices[0].message.content)
