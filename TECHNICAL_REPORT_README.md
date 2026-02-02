
# ✈️ Airline Revenue Management Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue?logo=python)](https://www.python.org/)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost-orange?logo=xgboost)](https://xgboost.readthedocs.io/)
[![TensorFlow](https://img.shields.io/badge/DL-LSTM-yellow?logo=tensorflow)](https://www.tensorflow.org/)
[![Status](https://img.shields.io/badge/Status-Prototype%20Complete-green)]()

**Author:** [Candidate Name]  
**Target Role:** Manager Data Science | Revenue Management

---

## 📖 Executive Summary
This repository contains the technical implementation of a **Revenue Management Intelligence Platform** designed to address the $500M+ annual revenue leakage problem in commercial aviation. 

The core objective is to move from reactive, historical analysis to **predictive, AI-driven decision making** across three pillars:
1.  **Demand Forecasting** (Event Detection)
2.  **Inventory Optimization** (No-Show Prediction)
3.  **Demand Unconstraining** (True Market Estimation)

### 🚀 Business Impact (Simulated)
| Core Challenge            | AI Solution                           | ROI Uplift per Flight                     |
| :------------------------ | :------------------------------------ | :---------------------------------------- |
| **Missed Event Spikes**   | Hybrid **LSTM + Prophet** Forecasting | **+$15,000** (Capture high-yield traffic) |
| **Empty Seat Spoilage**   | **XGBoost** Passenger-Level Scoring   | **+$19,200** (Dynamic overbooking)        |
| **Invisible/Lost Demand** | **EM Algorithm** for Unconstraining   | **+$8,000** (Yield optimization)          |
| **TOTAL IMPACT**          | **Integrated Ecosystem**              | **~$42,200 per flight**                   |

---

## 📂 Repository Contents

*   **`Qatar_Airways_Revenue_Management_Technical_Report.ipynb`**: The main technical deliverable. An interactive Jupyter Notebook that:
    *   Generates realistic synthetic PNR (Passenger Name Record) data.
    *   Implements the specific machine learning models (XGBoost, LSTM logic, EM).
    *   Visualizes feature importance and demand curves.
    *   Performs the financial ROI calculations referenced in the resume.

---

## 🛠️ Technical Architecture

### 1. Event-Driven Forecasting
Legacy systems (ARIMA/Moving Averages) often lag 3-4 days behind sudden demand surges.
*   **Method:** Combine **Prophet** (for robust seasonality handling) with **Long Short-Term Memory (LSTM)** networks (to capture non-linear sequence patterns).
*   **Result:** Early detection of events (e.g., conferences, holidays) allows for aggressive yield management 72+ hours earlier than competitors.

### 2. Passenger No-Show Prediction
Standard overbooking policies (e.g., "always +5 seats") are inefficient.
*   **Method:** **XGBoost Classifier** trained on 40+ features including:
    *   *Booking Lead Time*
    *   *Loyalty Status*
    *   *Connection Connection Time (<45 mins)*
    *   *Trip Composition (Solo vs. Group)*
*   **Result:** Enables a dynamic "Risk-Adjusted Capacity" that reduces empty seat spoilage by ~75% while maintaining denied boarding rates <0.1%.

### 3. Demand Unconstraining
Sold-out flights hide true demand, leading to suboptimal future capacity planning.
*   **Method:** **Expectation-Maximization (EM) Algorithm** to statistically reconstruct the tail of the demand curve based on booking velocity prior to stock-out.
*   **Result:** Identifies "invisible" customers, justifying up-gauging aircraft or increasing price floors (Bid Price) on high-demand routes.

---

## 💻 How to Run
1.  Clone this repository:
    ```bash
    git clone https://github.com/yourusername/airline-revenue-intelligence.git
    ```
2.  Install dependencies:
    ```bash
    pip install pandas numpy scikit-learn xgboost matplotlib seaborn
    ```
3.  Open the notebook:
    ```bash
    jupyter notebook Qatar_Airways_Revenue_Management_Technical_Report.ipynb
    ```

---

*This project was developed to demonstrate technical fit for the Manager Data Science role at Qatar Airways.*
