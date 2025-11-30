# **TURF BOOKING APP – NOTES**

---
all screens mobile first design dont care about desktop
use tailwind css
use shadcn/ui (or) animate.ui (or) magic-ui components where possible by MCP
use colour variables in global styles
use smooth animations/transitions use framer motion where needed
no tests


## **1. Bottom Navigation (4 Tabs)**

- **Home**
- **View**
- **book**
- **Gallery**
- **Contact**

---

## **2. Home Screen**
--Pitch Perfect langueage(en/ta)(dummy), theme toggle( dark/light)
- Hero banner (image/video)
- Book Now button → opens booking page
- Location preview (static map)
- Booking instructions preview (carousel)
- Turf highlights (photos preview)


---

## **3. Booking Page**

### **Header**

- Title: booking

### **Date Selector**

- Horizontal scroll
- 7 days visible only available
- Selected date = blue underline + blue dot + bold
- auto select today on load

### **Time Slots**

- Unavailable slots: greyed out
- Available slots: white + grey border
- Selected slot: blue border + blue text + blue dot

### **ask** 

  - cricket or booking as radio button groups
  - both in same line
  - Both enabled only after selecting date + time
  - as toggle button group

### **Payment**

- Button 1: **₹100 Advance** (outline)
- Button 2: **₹800 Full** (solid)
- both in same line
- Both enabled only after selecting date + time
- as toggle button group

### **user Details**
    ask name
    number
    email(optional)
    alternateContactName
    alternateContactNumber

### **Pay Now Button**
- Enabled only after selecting date, time, ask, payment + filling user details

### **Post-Payment**

- Generate 4-digit verification code
- Save booking
- Show confirmation (date, time, amount paid, verification code) as model in view page have download as img button
- add confetti side cannons on successful booking

```tsx
"use client"

import confetti from "canvas-confetti"

import { Button } from "@/components/ui/button"

export function ConfettiSideCannons() {
  const handleClick = () => {
    const end = Date.now() + 3 * 1000 // 3 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"]

    const frame = () => {
      if (Date.now() > end) return

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      })

      requestAnimationFrame(frame)
    }

    frame()
  }

  return (
    <div className="relative">
      <Button onClick={handleClick}>Trigger Side Cannons</Button>
    </div>
  )
}


---

## **4. View Tab**

- Show upcoming(greyed out) + past bookings
- Tap booking → full ticket view
- Ticket details:
    - Date
    - Time
    - Name, phone
    - Amount + mode
    - Payment status
    - Verification code
    - Booking ID
    - Download PDF
 - reschedule button for upcoming bookings

---

## **5. Gallery Tab**

- Photos/ Videos (thumbnail grid/list) like instagram
- Full-screen viewer
- Zoom + swipe

---

## **6. Contact Tab**

- Management phone numbers
- Email ID
- Business hours
- Maps widget
- WhatsApp link