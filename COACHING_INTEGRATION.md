# Coaching Integration Setup Guide

## Option 1: Calendly Integration (Recommended)

### Why Calendly?
- **Instant scheduling** - No email back-and-forth
- **Professional appearance** - Shows you're organized
- **Free tier** - Perfect for single consultation type
- **Automatic reminders** - Reduces no-shows
- **Calendar sync** - Blocks your busy times automatically

### Step-by-Step Setup

#### 1. Create Calendly Account
1. Go to [calendly.com](https://calendly.com)
2. Sign up with cortegafit@gmail.com
3. Connect your Google Calendar

#### 2. Configure Your Event Type
1. Create event: "Free Fitness Consultation"
2. Set duration: 30 minutes
3. Set availability (e.g., Mon-Fri 10am-6pm)
4. Add buffer time between meetings (15 min recommended)
5. Set booking conditions:
   - Minimum notice: 24 hours
   - Maximum advance booking: 2 weeks

#### 3. Customize Questions
Add these screening questions to your Calendly event:
- Primary fitness goal (dropdown)
- Current experience level (dropdown)
- Biggest challenge (text field)
- How committed are you? (1-10 scale)

#### 4. Get Your Link
Your link will be: `https://calendly.com/cortegafit/free-consultation`

#### 5. Implementation in Modal

**Option A: Direct Link (Simplest)**
```jsx
// Replace the form submit with:
<button
  onClick={() => window.open('https://calendly.com/cortegafit/free-consultation', '_blank')}
  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600..."
>
  Schedule Free Consultation
</button>
```

**Option B: Embedded Widget**
```jsx
// Add Calendly embed script to your HTML head
<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js"></script>

// In your modal:
<div 
  className="calendly-inline-widget" 
  data-url="https://calendly.com/cortegafit/free-consultation"
  style={{ minWidth: '320px', height: '630px' }}
/>
```

---

## Option 2: Form-to-Email Service

### Using Web3Forms (Free, No Account Needed)

#### 1. Get Access Key
1. Go to [web3forms.com](https://web3forms.com)
2. Enter cortegafit@gmail.com
3. Check your email for access key
4. Save the key (looks like: `YOUR_ACCESS_KEY_HERE`)

#### 2. Update Form Handler
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      access_key: "YOUR_ACCESS_KEY_HERE",
      subject: `Free Consultation Request - ${formData.name}`,
      from_name: formData.name,
      email: formData.email,
      message: `
        Phone: ${formData.phone}
        Goal: ${formData.goal}
        Experience: ${formData.experience}
        Commitment: ${formData.commitment}
        Challenges: ${formData.challenges}
        Preferred Contact: ${formData.preferredContact}
      `
    }),
  });

  if (response.ok) {
    setCurrentStep('success');
  }
};
```

### Using Formspree (Free Tier: 50 submissions/month)

#### 1. Setup
1. Sign up at [formspree.io](https://formspree.io)
2. Create new form
3. Get your endpoint: `https://formspree.io/f/YOUR_FORM_ID`

#### 2. Update Form
```jsx
<form
  action="https://formspree.io/f/YOUR_FORM_ID"
  method="POST"
  onSubmit={handleSubmit}
>
  {/* Your existing form fields */}
</form>
```

---

## Comparison Table

| Feature | Calendly | Web3Forms | Formspree | Current (mailto) |
|---------|----------|-----------|-----------|------------------|
| Setup Time | 15 min | 5 min | 10 min | Already done |
| User Experience | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Professional Look | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Automatic Scheduling | ✅ | ❌ | ❌ | ❌ |
| Email Notifications | ✅ | ✅ | ✅ | Manual |
| Calendar Integration | ✅ | ❌ | ❌ | ❌ |
| Free Tier | ✅ | ✅ | 50/month | ✅ |
| No Email Client Needed | ✅ | ✅ | ✅ | ❌ |

---

## My Recommendation

**Go with Calendly** because:
1. Most professional appearance
2. Saves you time (no email tennis)
3. Higher conversion rate (easier for users)
4. Free tier is perfect for your needs
5. Makes you look established and organized

**Implementation Priority:**
1. Set up Calendly first
2. Use direct link approach initially
3. Test with a few clients
4. Consider embedding later if needed

---

## Quick Win Implementation (5 minutes)

Just replace your current email handler with:

```jsx
// In handleSubmit function, replace everything with:
window.open('https://calendly.com/cortegafit/free-consultation', '_blank');
setCurrentStep('success');
```

That's it! Users click button → Calendly opens → They book → You both get confirmation emails.

---

## Notes
- Your current email is cortegafit@gmail.com (not cristian@ortegafit.com)
- Update the email in your current form if keeping it
- Consider adding a "Text me" option with your phone number for quick questions