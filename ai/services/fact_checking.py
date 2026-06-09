from serpapi import GoogleSearch
from openai import OpenAI
from core.config import settings

openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

def get_serp_results(query: str) -> str:
    if not settings.SERPAPI_API_KEY:
        return ""
        
    params = {
      "q": query,
      "hl": "en",
      "gl": "us",
      "api_key": settings.SERPAPI_API_KEY
    }
    
    try:
        search = GoogleSearch(params)
        results = search.get_dict()
        organic_results = results.get("organic_results", [])
        
        snippets = []
        for res in organic_results[:3]: # top 3 results
            snippets.append(res.get("snippet", ""))
        return "\n".join(snippets)
    except Exception as e:
        print(f"Error fetching SERP: {e}")
        return ""

def fact_check_article(title: str, summary: str) -> int:
    """Uses SERP to cross-reference the summary and returns a reliability score 0-10."""
    if not title or not summary:
        return 5
        
    # Search for related facts
    search_context = get_serp_results(title)
    
    prompt = f"""Evaluate the reliability of the following news summary based on the provided search engine results context. 
Return ONLY a single integer score between 0 and 10 (10 being highly reliable/verified, 0 being fake news/contradicted).

Summary to check:
{summary}

Search Engine Context:
{search_context if search_context else "No external context available. Judge based on the summary's internal consistency and neutrality."}
"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a strict fact-checker. Respond ONLY with an integer from 0 to 10."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0
        )
        score_str = response.choices[0].message.content.strip()
        # Ensure it's a number
        score = int(''.join(filter(str.isdigit, score_str)))
        return min(max(score, 0), 10)
    except Exception as e:
        print(f"Error in fact checking: {e}")
        return 5 # Neutral score on error
