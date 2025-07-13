from flask import Flask, request, jsonify
from hdbscan import HDBSCAN
from bertopic import BERTopic
from flask_cors import CORS
from sklearn.feature_extraction.text import CountVectorizer
from sentence_transformers import SentenceTransformer
from umap import UMAP
import re
import nltk
from collections import Counter
import numpy as np

nltk.download("stopwords")
from nltk.corpus import stopwords

app = Flask(__name__)
CORS(app)

stop_words = set(stopwords.words("english"))

# Enhanced junk/common topic terms to ignore
JUNK_TOPICS = {
    "this", "your", "me", "to", "a", "you", "it", "the", "is", "are", "was", "were",
    "view", "new", "click", "login", "account", "hello", "email", "message", "update",
    "please", "thank", "thanks", "best", "regards", "sincerely", "dear", "hi", "hey",
    "get", "got", "will", "would", "could", "should", "may", "might", "can", "now",
    "today", "tomorrow", "yesterday", "time", "good", "great", "nice", "well", "here",
    "there", "where", "when", "what", "how", "why", "who", "which", "that", "these",
    "those", "they", "them", "their", "theirs", "we", "us", "our", "ours", "he", "she",
    "his", "her", "hers", "its", "my", "mine", "your", "yours", "i", "am", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "done", "make", "made", "take",
    "taken", "took", "come", "came", "go", "went", "gone", "see", "saw", "seen", "know",
    "knew", "known", "think", "thought", "say", "said", "tell", "told", "ask", "asked",
    "want", "wanted", "need", "needed", "use", "used", "find", "found", "give", "gave",
    "given", "work", "worked", "working", "look", "looked", "looking", "feel", "felt",
    "feeling", "try", "tried", "trying", "keep", "kept", "keeping", "let", "put", "set"
}

# Enhanced topic name mapping with more categories
TOPIC_NAME_OVERRIDES = {
    # Social Media & Communication
    "linkedin": "LinkedIn",
    "snapchat": "Snapchat", 
    "instagram": "Instagram",
    "facebook": "Facebook",
    "twitter": "Twitter",
    "whatsapp": "WhatsApp",
    "telegram": "Telegram",
    "discord": "Discord",
    "slack": "Slack",
    "teams": "Microsoft Teams",
    "zoom": "Zoom Meetings",
    "skype": "Skype",
    
    # Development & Tech
    "github": "GitHub",
    "gitlab": "GitLab",
    "bitbucket": "Bitbucket",
    "stackoverflow": "Stack Overflow",
    "codepen": "CodePen",
    "jira": "Jira",
    "confluence": "Confluence",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "Google Cloud",
    "firebase": "Firebase",
    "heroku": "Heroku",
    "netlify": "Netlify",
    "vercel": "Vercel",
    
    # Job & Career
    "job": "Job Opportunities",
    "jobs": "Job Opportunities",
    "career": "Career Development",
    "interview": "Job Interviews",
    "hiring": "Hiring & Recruitment",
    "recruitment": "Hiring & Recruitment",
    "resume": "Resume & CV",
    "cv": "Resume & CV",
    "application": "Job Applications",
    "position": "Job Positions",
    "opportunity": "Opportunities",
    "internship": "Internships",
    "freelance": "Freelance Work",
    
    # Learning & Education
    "course": "Online Courses",
    "courses": "Online Courses",
    "tutorial": "Tutorials",
    "webinar": "Webinars",
    "workshop": "Workshops",
    "training": "Training",
    "certification": "Certifications",
    "certificate": "Certifications",
    "learning": "Learning Resources",
    "education": "Education",
    "udemy": "Udemy",
    "coursera": "Coursera",
    "edx": "EdX",
    "pluralsight": "Pluralsight",
    "skillshare": "Skillshare",
    
    # Business & Finance
    "invoice": "Billing & Invoices",
    "payment": "Payments",
    "billing": "Billing & Invoices",
    "receipt": "Receipts",
    "subscription": "Subscriptions",
    "pricing": "Pricing",
    "upgrade": "Account Upgrades",
    "renewal": "Renewals",
    "refund": "Refunds",
    "finance": "Finance",
    "business": "Business",
    "startup": "Startups",
    "investment": "Investments",
    "funding": "Funding",
    
    # Marketing & Sales
    "newsletter": "Newsletters",
    "promotion": "Promotions",
    "offer": "Special Offers",
    "discount": "Discounts",
    "sale": "Sales",
    "deal": "Deals",
    "marketing": "Marketing",
    "campaign": "Campaigns",
    "advertisement": "Advertisements",
    "affiliate": "Affiliate Marketing",
    
    # Entertainment & Content
    "youtube": "YouTube",
    "podcast": "Podcasts",
    "blog": "Blogs",
    "article": "Articles",
    "news": "News",
    "medium": "Medium",
    "substack": "Substack",
    "reddit": "Reddit",
    "hacker": "Hacker News",
    "hackernews": "Hacker News",
    "devto": "Dev.to",
    "twitch": "Twitch",
    "spotify": "Spotify",
    "netflix": "Netflix",
    "amazon": "Amazon",
    
    # Events & Meetings
    "event": "Events",
    "conference": "Conferences",
    "meetup": "Meetups",
    "meeting": "Meetings",
    "session": "Sessions",
    "appointment": "Appointments",
    "calendar": "Calendar Events",
    "reminder": "Reminders",
    "invitation": "Invitations",
    
    # Security & Notifications
    "security": "Security Alerts",
    "alert": "Alerts",
    "notification": "Notifications",
    "verification": "Account Verification",
    "confirm": "Confirmations",
    "reset": "Password Reset",
    "password": "Password & Security",
    "login": "Login Activity",
    "signin": "Sign-in Activity",
    "backup": "Backups",
    
    # Health & Wellness
    "health": "Health & Wellness",
    "fitness": "Fitness",
    "medical": "Medical",
    "doctor": "Healthcare",
    "appointment": "Medical Appointments",
    "pharmacy": "Pharmacy",
    "insurance": "Insurance",
    
    # Travel & Transportation
    "travel": "Travel",
    "flight": "Flights",
    "hotel": "Hotels",
    "booking": "Bookings",
    "reservation": "Reservations",
    "uber": "Uber",
    "lyft": "Lyft",
    "airbnb": "Airbnb",
    "trip": "Trips",
    
    # Shopping & E-commerce
    "shopping": "Shopping",
    "order": "Orders",
    "delivery": "Deliveries",
    "shipping": "Shipping",
    "tracking": "Package Tracking",
    "return": "Returns",
    "exchange": "Exchanges",
    "cart": "Shopping Cart",
    "checkout": "Checkout",
    
    # Support & Help
    "support": "Customer Support",
    "help": "Help & Support",
    "ticket": "Support Tickets",
    "issue": "Issues",
    "bug": "Bug Reports",
    "feedback": "Feedback",
    "survey": "Surveys",
    "review": "Reviews",
    "rating": "Ratings"
}

# Enhanced domain-based topic detection
DOMAIN_TOPICS = {
    "linkedin.com": "LinkedIn",
    "github.com": "GitHub",
    "stackoverflow.com": "Stack Overflow",
    "medium.com": "Medium",
    "substack.com": "Substack",
    "youtube.com": "YouTube",
    "netflix.com": "Netflix",
    "spotify.com": "Spotify",
    "udemy.com": "Udemy",
    "coursera.org": "Coursera",
    "edx.org": "EdX",
    "pluralsight.com": "Pluralsight",
    "skillshare.com": "Skillshare",
    "zoom.us": "Zoom Meetings",
    "slack.com": "Slack",
    "discord.com": "Discord",
    "notion.so": "Notion",
    "figma.com": "Figma",
    "canva.com": "Canva",
    "dropbox.com": "Dropbox",
    "drive.google.com": "Google Drive",
    "onedrive.live.com": "OneDrive",
    "trello.com": "Trello",
    "asana.com": "Asana",
    "monday.com": "Monday.com",
    "jira.atlassian.com": "Jira",
    "confluence.atlassian.com": "Confluence",
    "paypal.com": "PayPal",
    "stripe.com": "Stripe",
    "square.com": "Square",
    "shopify.com": "Shopify",
    "amazon.com": "Amazon",
    "ebay.com": "eBay",
    "etsy.com": "Etsy",
    "uber.com": "Uber",
    "lyft.com": "Lyft",
    "airbnb.com": "Airbnb",
    "booking.com": "Booking.com",
    "expedia.com": "Expedia",
    "reddit.com": "Reddit",
    "hackernews.com": "Hacker News",
    "news.ycombinator.com": "Hacker News",
    "dev.to": "Dev.to"
}

# Enhanced text cleaning with better preprocessing
def clean_text(text):
    # Remove URLs
    text = re.sub(r"http\S+|www\S+|https\S+", "", text, flags=re.MULTILINE)
    
    # Remove email addresses
    text = re.sub(r"\S+@\S+", "", text)
    
    # Remove phone numbers
    text = re.sub(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b", "", text)
    
    # Remove special characters but keep alphanumeric and spaces
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove extra whitespaces
    text = re.sub(r"\s+", " ", text)
    
    # Filter out stop words and short words
    words = [word for word in text.split() if 
             word not in stop_words and 
             len(word) > 2 and 
             word not in JUNK_TOPICS and
             not word.isdigit()]
    
    return " ".join(words)

# Extract domain from email address
def extract_domain(email_from):
    if not email_from or "@" not in email_from:
        return None
    
    # Extract email from format like "Name <email@domain.com>"
    match = re.search(r"<([^>]+)>", email_from)
    if match:
        email = match.group(1)
    else:
        email = email_from
    
    # Extract domain
    try:
        domain = email.split("@")[1].lower()
        return domain
    except:
        return None

# Enhanced topic name mapping with domain consideration
def map_topic_name(keywords, email_from=None):
    # First check if we can determine topic from sender domain
    if email_from:
        domain = extract_domain(email_from)
        if domain and domain in DOMAIN_TOPICS:
            return DOMAIN_TOPICS[domain]
    
    # Check keywords for topic mapping
    for word in keywords:
        cleaned = word.lower()
        for key, name in TOPIC_NAME_OVERRIDES.items():
            if key in cleaned or cleaned in key:
                return name
    
    # If no direct mapping found, try to create a more meaningful name
    # by combining related keywords
    meaningful_words = []
    for word in keywords:
        if word.lower() not in JUNK_TOPICS and len(word) > 2:
            meaningful_words.append(word.title())
    
    if meaningful_words:
        return " & ".join(meaningful_words[:3])  # Limit to 3 words max
    
    return None

# Enhanced clustering with better parameters
def get_enhanced_clustering_models(num_docs):
    # Adjust parameters based on number of documents
    if num_docs < 20:
        min_cluster_size = 2
        n_neighbors = min(5, num_docs - 1)
    elif num_docs < 50:
        min_cluster_size = 3
        n_neighbors = 10
    else:
        min_cluster_size = max(3, num_docs // 20)
        n_neighbors = 15
    
    # Use a more powerful embedding model
    embedding_model = SentenceTransformer("all-mpnet-base-v2")
    
    # Fine-tune UMAP parameters
    umap_model = UMAP(
        n_neighbors=n_neighbors,
        n_components=5,
        min_dist=0.0,
        metric='cosine',
        random_state=42
    )
    
    # Fine-tune HDBSCAN parameters
    hdbscan_model = HDBSCAN(
        min_cluster_size=min_cluster_size,
        min_samples=1,
        metric='euclidean',
        cluster_selection_method='eom',
        prediction_data=True
    )
    
    # Enhanced vectorizer with better parameters
    vectorizer_model = CountVectorizer(
        stop_words="english",
        min_df=2,
        max_df=0.8,
        ngram_range=(1, 2),  # Include bigrams
        max_features=1000
    )
    
    return embedding_model, umap_model, hdbscan_model, vectorizer_model

# Post-process topics to merge similar ones
def merge_similar_topics(topic_map, similarity_threshold=0.7):
    from difflib import SequenceMatcher
    
    topics = list(topic_map.keys())
    merged_topics = {}
    used_topics = set()
    
    for i, topic1 in enumerate(topics):
        if topic1 in used_topics:
            continue
            
        merged_emails = topic_map[topic1][:]
        primary_topic = topic1
        
        for j, topic2 in enumerate(topics[i+1:], i+1):
            if topic2 in used_topics:
                continue
                
            # Calculate similarity between topic names
            similarity = SequenceMatcher(None, topic1.lower(), topic2.lower()).ratio()
            
            if similarity > similarity_threshold:
                merged_emails.extend(topic_map[topic2])
                used_topics.add(topic2)
        
        used_topics.add(topic1)
        merged_topics[primary_topic] = merged_emails
    
    return merged_topics

@app.route("/cluster-topics", methods=["POST"])
def cluster_topics():
    print("Received request for clustering")
    data = request.get_json()
    print("Received data length:", len(data) if data else 0)

    if not data:
        return jsonify({"error": "No data provided"}), 400

    valid_emails = []
    for item in data:
        subject = item.get("subject", "").strip()
        snippet = item.get("snippet", "").strip()
        email_id = item.get("id", "").strip() or item.get("email_id", "").strip()
        from_ = item.get("from", "Unknown").strip()
        date = item.get("date")

        if subject and snippet:
            valid_emails.append({
                "text": f"{subject} {snippet}",
                "id": email_id,
                "subject": subject,
                "snippet": snippet,
                "from": from_,
                "date": date
            })

    if len(valid_emails) < 2:
        return jsonify({"error": "Need at least 2 valid emails"}), 400

    print(f"Valid emails to cluster: {len(valid_emails)}")

    # Enhanced text cleaning
    email_texts = [clean_text(e["text"]) for e in valid_emails]
    email_ids = [e["id"] for e in valid_emails]

    # Get enhanced clustering models
    embedding_model, umap_model, hdbscan_model, vectorizer_model = get_enhanced_clustering_models(len(valid_emails))

    # Create BERTopic model with enhanced parameters
    topic_model = BERTopic(
        embedding_model=embedding_model,
        umap_model=umap_model,
        hdbscan_model=hdbscan_model,
        vectorizer_model=vectorizer_model,
        top_n_words=8,  # Increased for better topic representation
        calculate_probabilities=True,
        verbose=True,
        nr_topics="auto"  # Let the model determine optimal number of topics
    )

    # Fit and transform
    topics, probabilities = topic_model.fit_transform(email_texts)

    # Build topic map with enhanced naming
    topic_map = {}
    for topic_num, eid in zip(topics, email_ids):
        meta = next((e for e in valid_emails if e["id"] == eid), {})
        
        try:
            topic_label = topic_model.get_topic(topic_num)
            if topic_label:
                top_words = [word for word, _ in topic_label[:8]]
                renamed = map_topic_name(top_words, meta.get("from", ""))
                topic_name = renamed or f"Topic {topic_num}"
            else:
                topic_name = f"Topic {topic_num}"
        except:
            topic_name = f"Topic {topic_num}"

        # Skip junk topics
        if topic_name.lower() in JUNK_TOPICS or not topic_name.strip():
            continue

        email_obj = {
            "id": eid,
            "subject": meta.get("subject", ""),
            "snippet": meta.get("snippet", ""),
            "from": meta.get("from", "Unknown"),
            "date": meta.get("date"),
        }
        topic_map.setdefault(topic_name, []).append(email_obj)

    # Merge similar topics
    topic_map = merge_similar_topics(topic_map)

    # Sort topics by number of emails (descending)
    sorted_topics = sorted(topic_map.items(), key=lambda x: len(x[1]), reverse=True)
    
    # Create result with additional metadata
    result = []
    for topic, emails in sorted_topics:
        if len(emails) > 0:  # Only include topics with emails
            result.append({
                "topic": topic,
                "emails": emails,
                "count": len(emails),
                "percentage": round((len(emails) / len(valid_emails)) * 100, 1)
            })

    print(f"Generated {len(result)} topics")
    return jsonify(result)

if __name__ == "__main__":
    app.run(port=5001, debug=True)