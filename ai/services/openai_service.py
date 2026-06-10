from openai import OpenAI
from core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def summarize_article(content: str, language: str) -> str:
    """Summarizes the raw content of an article."""
    if not content or len(content) < 50:
        return ""
        
    prompt = f"Please provide a concise, 3-4 sentence summary of the following news article. Write the summary in the original language of the article ({language}).\n\nArticle Content:\n{content[:20000]}" # Limit to 20000 chars to save tokens
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional news editor. Summarize articles neutrally and concisely."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error summarizing article: {e}")
        return ""
