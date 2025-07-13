from flask import Flask, request, jsonify
from hdbscan import HDBSCAN
from bertopic import BERTopic
from flask_cors import CORS
from sklearn.feature_extraction.text import CountVectorizer
from sentence_transformers import SentenceTransformer
from umap import UMAP
import re
import nltk

nltk.download("stopwords")
from nltk.corpus import stopwords

app = Flask(__name__)
CORS(app)

stop_words = set(stopwords.words("english"))

# Junk/common topic terms to ignore
JUNK_TOPICS = {
    "this", "your", "me", "to", "a", "you", "it", "the",
    "view", "new", "click", "login", "account", "hello", "email"
}

# Map common keywords to better topic labels
TOPIC_NAME_OVERRIDES = {
    "linkedin": "LinkedIn",
    "snapchat": "Snapchat",
    "github": "GitHub",
    "job": "Jobs",
    "interview": "Jobs",
    "session": "Sessions",
    "webinar": "Webinars",
    "zoom": "Meetings",
    "invoice": "Billing",
    "payment": "Billing",
    "newsletter": "Newsletters",
    "offer": "Promotions"
}

# Utility to clean input text
def clean_text(text):
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z ]+", " ", text)
    text = text.lower()
    words = [word for word in text.split() if word not in stop_words and len(word) > 2]
    return " ".join(words)

# Try to rename a topic using keywords
def map_topic_name(keywords):
    for word in keywords:
        cleaned = word.lower()
        for key, name in TOPIC_NAME_OVERRIDES.items():
            if key in cleaned:
                return name
    return None

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

    email_texts = [clean_text(e["text"]) for e in valid_emails]
    email_ids = [e["id"] for e in valid_emails]

    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    umap_model = UMAP(n_neighbors=15, n_components=5, min_dist=0.0, metric='cosine')
    hdbscan_model = HDBSCAN(min_cluster_size=5, metric='euclidean', prediction_data=True)
    vectorizer_model = CountVectorizer(stop_words="english", min_df=2)

    topic_model = BERTopic(
        embedding_model=embedding_model,
        umap_model=umap_model,
        hdbscan_model=hdbscan_model,
        vectorizer_model=vectorizer_model,
        top_n_words=5,
        calculate_probabilities=True,
        verbose=True,
    )

    topics, _ = topic_model.fit_transform(email_texts)

    topic_map = {}
    for topic_num, eid in zip(topics, email_ids):
        try:
            topic_label = topic_model.get_topic(topic_num)
            top_words = [word for word, _ in topic_label[:5]]
            renamed = map_topic_name(top_words)
            topic_name = renamed or ", ".join(top_words).title()
        except:
            topic_name = f"Topic {topic_num}"

        if topic_name.lower() in JUNK_TOPICS or not topic_name.strip():
            continue

        meta = next((e for e in valid_emails if e["id"] == eid), {})
        email_obj = {
            "id": eid,
            "subject": meta.get("subject", ""),
            "snippet": meta.get("snippet", ""),
            "from": meta.get("from", "Unknown"),
            "date": meta.get("date"),
        }
        topic_map.setdefault(topic_name, []).append(email_obj)

    result = [{"topic": topic, "emails": emails} for topic, emails in topic_map.items()]
    return jsonify(result)

if __name__ == "__main__":
    app.run(port=5001)