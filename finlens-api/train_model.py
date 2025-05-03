import pandas as pd
import random
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
import joblib
from preprocess import preprocess_line


model = joblib.load("receipt_categorizer.pkl")

# 1. Base dataset
base_dataset = {
    "Groceries": [
        "Bought rice", "Milk 1L", "Tomatoes and onions", "Supermarket vegetables", "Potato bag", "eggs",
        "Grocery store shopping", "Bananas","Apples", "Ghee and oil", "Sugar 1kg", "Flour pack", "Onion 2kg", "Cabbage", "Spinach bunch", "butter", "milk"
    ],
    "Food": [
        "Burger King meal", "Pizza Hut", "Chicken wings", "KFC combo", "Subway sandwich", "Domino's pizza", "Ice cream", "chips", "Pasta", "Juice",
        "McDonald's fries", "Dinner at restaurant", "Lunch takeaway", "Pasta order", "Cafe mocha", "Iced coffee", "Sushi rolls", "bread", "Soft Drink 2L"
    ],
    "Entertainment": [
        "Netflix subscription", "Spotify Premium", "Movie ticket","DVD", "Board game", "Concert ticket", "Disney+ monthly fee",
        "Cinema snacks", "Amusement park", "Game purchase", "Xbox subscription", "YouTube Premium", "Cricket match ticket", "Puzzle Game"
    ],
    "Transportation": [
        "Uber ride", "Gas station fill-up", "Bus ticket", "Train fare", "Taxi service", "Petrol pump",
        "Bike rental", "Auto-rickshaw", "Cab service", "Metro ride", "Parking fees", "EV charging"
    ],
    "Shopping": [
        "Amazon online order", "Apple Store", "Bought clothes", "Electronics from BestBuy", "Online gadget purchase",
        "New shoes", "Clothing from H&M", "Shopping at Zara", "Backpack purchase", "Mobile accessories", "Watch from Flipkart"
    ],
    "Utilities": [
        "Water bill", "Electricity bill", "Internet fee", "Wifi bill", "Monthly utilities", "Power bank",
        "Mobile recharge", "Gas bill", "Garbage collection fee", "Electric meter recharge", "Landline charges", "USB", "Cable"
    ],
    "Personal Care": [
        "Toothpaste and shampoo", "Soap pack", "Sunscreen cream", "Face wash", "Body lotion",
        "Hair conditioner", "Shaving cream", "Deodorant", "Perfume bottle", "Moisturizer", "Nail cutter", "Comb purchase", "Lip Balm"
    ],
    "Health": [
        "Vitamin tablets", "Cough syrup", "Painkillers", "First aid kit", "Antiseptic", "Bandages", "Multivitamins", "Aspirin",
        "Doctor consultation", "Pharmacy bill", "Eye drops", "Paracetamol", "Sanitary pads", "Mask and sanitizer", "Thermometer"
    ]
}

# 2. Expand to 100 samples per category
dataset = {}
for category, samples in base_dataset.items():
    dataset[category] = []
    for _ in range(100):
        item = random.choice(samples)
        dataset[category].append(item)
        quantity = random.randint(1, 5)
        dataset[category].append(f"{item} x{quantity}")

# 3. Prepare Data
data = []
for category, items in dataset.items():
    for item in items:
        data.append((item.lower(), category))

df = pd.DataFrame(data, columns=["item_text", "category"])

# 4. Split
X_train, X_test, y_train, y_test = train_test_split(df['item_text'], df['category'], test_size=0.2, random_state=42)

# 5. Build Pipeline (Vectorizer + Model)
model = make_pipeline(CountVectorizer(), MultinomialNB())

# 6. Train
model.fit(X_train, y_train)

# 7. Evaluate (optional for checking)
print("Model accuracy on test set:", model.score(X_test, y_test))

# 8. Save model
joblib.dump(model, "receipt_categorizer.pkl")
print("Model saved successfully as receipt_categorizer.pkl")
