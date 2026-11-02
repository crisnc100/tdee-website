export default function FAQSection() {
  const faqs = [
    {
      question: "How accurate is this calculator?",
      answer: "Our calculator uses an advanced formula that accounts for more variables than standard calculators. However, individual metabolism can vary by 5-10%. We recommend using the error margin range and tracking your results over 2-3 weeks to fine-tune your numbers."
    },
    {
      question: "Should I eat back exercise calories?",
      answer: "No! Our TDEE calculation already includes your exercise calories. The number we provide is your total daily target including all activities and exercise."
    },
    {
      question: "How often should I recalculate?",
      answer: "We recommend recalculating every 4-6 weeks, or whenever you experience significant changes in weight (±10 lbs), activity level, or exercise routine."
    },
    {
      question: "What's the difference between BMR and TDEE?",
      answer: "BMR (Base Metabolic Rate) is the calories you burn at complete rest. TDEE includes BMR plus all calories burned through daily activities, exercise, and digestion. You should eat based on your TDEE, not your BMR."
    },
    {
      question: "Why do you need my step count?",
      answer: "Daily steps are a key component of NEAT (Non-Exercise Activity Thermogenesis). Steps beyond your baseline (around 2,000) can add significant calories to your daily expenditure, making our calculation more precise than traditional activity multipliers."
    },
    {
      question: "What if I don't know my body fat percentage?",
      answer: "The calculator works without body fat percentage using the Mifflin-St Jeor formula. However, if you have this data (from DEXA, BodPod, or other methods), it enables the more accurate Katch-McArdle formula for BMR calculation."
    }
  ];

  return (
    <div className="mt-16 pb-16 px-4">
      <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
        Frequently Asked Questions
      </h2>
      
      <div className="space-y-6 max-w-3xl mx-auto">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-lg p-6 shadow-sm"
          >
            <h3 className="font-semibold mb-2 text-foreground">{faq.question}</h3>
            <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}