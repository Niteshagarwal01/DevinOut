# Chatroom Test Instructions

## Complete 3-Way Chatroom Flow Test

### Step 1: Sign in as Business
1. Go to `localhost:3000/sign-in`
2. Sign in with business account: `techniteshgamer@gmail.com`
3. You should be redirected to `/dashboard/business`

### Step 2: Create New Project
1. Click "New Project" tab
2. Chat with AI and provide:
   - Website type: "e-commerce"
   - Design: "modern"
   - Features: "payment gateway, user login"
   - Pages: "5"
   - Timeline: "1 month"
   - Budget: "30-40k"
3. Click "Create My Team" button when AI suggests it

### Step 3: View Teams
1. Click "View Details" on the newly created project
2. You should see 3 team options (Premium, Pro, Freemium)
3. Verify you see different developers (including MC Heal if showing)

### Step 4: Select Team & Create Chatroom
1. Click "Select FREE Team" on the Freemium option
2. Wait for team selection to complete
3. You should be automatically redirected to `/chat/[chatRoomId]`

### Step 5: Verify Chatroom
1. Check that chatroom loads without "Chat room not found" error
2. Verify you see:
   - 3 participants (Business, Designer, Developer)
   - Welcome message from business owner
   - Message input box at bottom

### Step 6: Send Test Message
1. Type "Hello team!" in the message box
2. Click Send
3. Message should appear immediately
4. Your message should have royal gradient styling (sent by you)

### Step 7: Test as Freelancer
1. Open incognito/private window
2. Sign in as freelancer: `officialmcheal@gmail.com`
3. Go to `/dashboard/freelancer`
4. If you were selected in a team, you should see project in "Ongoing" tab
5. Click "Open Chat" to access same chatroom
6. Send message "Hi from developer!"
7. Both messages should be visible

## Expected Results
- ✅ No "Chat room not found" errors
- ✅ 3 participants visible
- ✅ Messages persist and sync
- ✅ Different styling for sent/received messages
- ✅ Real-time polling works (3 second refresh)

## If Issues Occur
- Check browser console for errors
- Verify chatRoomId in URL exists in database
- Confirm all 3 participants have valid User records
