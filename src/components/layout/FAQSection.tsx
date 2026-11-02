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
    <section aria-labelledby="faq-heading" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 pb-16">
      <div className="flex items-center gap-3 mb-6">
        <span aria-hidden="true" className="label-caps text-accent-ink">FAQ</span>
        <h2 id="faq-heading" className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Frequently Asked Questions
        </h2>
        <span aria-hidden="true" className="h-px flex-1 min-w-4 bg-border" />
      </div>

      <div className="panel divide-y divide-border">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="grid gap-2 lg:gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] p-5 sm:p-6"
          >
            <h3 className="font-semibold text-foreground flex gap-3">
              <span aria-hidden="true" className="readout text-sm font-normal text-muted-foreground pt-0.5 shrink-0">
                Q.{String(index + 1).padStart(2, '0')}
              </span>
              <span>{faq.question}</span>
            </h3>
            <p className="text-muted-foreground leading-relaxed pl-12 lg:pl-0">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
