from flask import Flask, request, jsonify
from bertopic import BERTopic
from flask_cors import CORS
from sklearn.feature_extraction.text import CountVectorizer
import re
import nltk

nltk.download("stopwords")
from nltk.corpus import stopwords

app = Flask(__name__)
CORS(app)

stop_words = set(stopwords.words("english"))

def clean_text(text):
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z ]+", " ", text)
    text = text.lower()
    words = [word for word in text.split() if word not in stop_words and len(word) > 2]
    return " ".join(words)

@app.route("/cluster-topics", methods=["POST"])
def cluster_topics():
    print("📩 Received request for clustering")
    data = request.get_json()
    print("📨 Received data length:", len(data) if data else 0)

    if not data:
        return jsonify({"error": "No data provided"}), 400

    valid_emails = []
    for item in data:
        subject = item.get("subject", "").strip()
        snippet = item.get("snippet", "").strip()
        email_id = item.get("email_id", "").strip()

        if subject and snippet:
            valid_emails.append({
                "text": f"{subject} {snippet}",
                "email_id": email_id,
                "subject": subject,
                "snippet": snippet
            })

    if len(valid_emails) < 2:
        return jsonify({"error": "Need at least 2 valid emails"}), 400

    print(f"✅ Valid emails to cluster: {len(valid_emails)}")

    email_texts = [clean_text(e["text"]) for e in valid_emails]
    email_ids = [e["email_id"] for e in valid_emails]
    subjects = [e["subject"] for e in valid_emails]
    snippets = [e["snippet"] for e in valid_emails]

    # ✅ Reinitialize topic model inside the route (optional but safe)
    vectorizer_model = CountVectorizer(stop_words="english", min_df=2)
    topic_model = BERTopic(vectorizer_model=vectorizer_model)

    topics, _ = topic_model.fit_transform(email_texts)

    topic_map = {}
    for topic_num, eid, subject, snippet in zip(topics, email_ids, subjects, snippets):
        try:
            topic_label = topic_model.get_topic(topic_num)
            topic_name = topic_label[0][0] if topic_label else f"Topic {topic_num}"
        except:
            topic_name = f"Topic {topic_num}"

        if topic_name.lower() in ["this", "your", "me", "to", "a", "you", "it", "the"]:
            continue

        email_obj = {
            "id": eid,
            "subject": subject,
            "snippet": snippet
        }

        topic_map.setdefault(topic_name, []).append(email_obj)

    result = [{"topic": topic, "emails": emails} for topic, emails in topic_map.items()]
    return jsonify(result)

if __name__ == "__main__":
    app.run(port=5001)
