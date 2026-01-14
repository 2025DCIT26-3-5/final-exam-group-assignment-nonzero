const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. DATABASE CONNECTION ---
mongoose.connect('mongodb://127.0.0.1:27017/nonzero_db')
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// --- 2. SCHEMAS ---

// NEW: User Schema (Simple)
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true } // Storing plain text for school project only!
});
const User = mongoose.model('User', UserSchema);

// UPDATED: Habit Schema (Added ownerId)
const HabitSchema = new mongoose.Schema({
    ownerId: { type: String, required: true }, // <--- Links habit to a specific user
    name: String,
    completed: { type: Boolean, default: false },
    streak: { type: Number, default: 0 },
    history: { type: [String], default: [] } 
});
const Habit = mongoose.model('Habit', HabitSchema);

// --- 3. HELPER: Streak Logic ---
function calculateStats(historyDates, todayStr) {
    const sorted = [...new Set(historyDates)].sort().reverse();
    const isCompletedToday = sorted.includes(todayStr);
    let streak = 0;
    let currentCheck = new Date(todayStr);
    
    if (!isCompletedToday) currentCheck.setDate(currentCheck.getDate() - 1);

    while (true) {
        const dateString = currentCheck.toISOString().split('T')[0]; 
        if (sorted.includes(dateString)) {
            streak++;
            currentCheck.setDate(currentCheck.getDate() - 1); 
        } else { break; }
    }
    return { completed: isCompletedToday, streak };
}

// --- 4. API ROUTES ---

// AUTH: Register
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Check if user exists
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ error: "Username already taken" });

        const newUser = new User({ username, password });
        await newUser.save();
        res.json(newUser); // Return the new user so they are logged in immediately
    } catch (error) {
        res.status(500).json({ error: "Register failed" });
    }
});

// AUTH: Login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (!user) return res.status(400).json({ error: "Invalid username or password" });
        
        res.json(user); // Send back the user ID
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
});

// GET: Fetch habits for a SPECIFIC user
app.get('/habits', async (req, res) => {
    try {
        const { userId } = req.query; // Client sends: /habits?userId=123
        if (!userId) return res.status(400).json({ error: "User ID required" });

        const todayStr = new Date().toISOString().split('T')[0]; 
        const habits = await Habit.find({ ownerId: userId }); // <--- Filter by Owner

        const updatedHabits = await Promise.all(habits.map(async (habit) => {
            const stats = calculateStats(habit.history, todayStr);
            if (habit.completed !== stats.completed || habit.streak !== stats.streak) {
                habit.completed = stats.completed;
                habit.streak = stats.streak;
                await habit.save();
            }
            return habit;
        }));
        
        res.json(updatedHabits);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch habits" });
    }
});

// POST: Add a new habit (Linked to User)
app.post('/habits', async (req, res) => {
    try {
        const habit = new Habit({
            ownerId: req.body.ownerId, // <--- Save the owner
            name: req.body.name,
            history: [] 
        });
        await habit.save();
        res.json(habit);
    } catch (error) {
        res.status(500).json({ error: "Could not add habit" });
    }
});

// TOGGLE & DELETE (Same as before, no changes needed for ID logic usually, but let's keep it safe)
app.put('/habits/:id/toggle', async (req, res) => {
    try {
        const { date } = req.body; 
        const habit = await Habit.findById(req.params.id);
        if (!habit) return res.status(404).json({ error: "Habit not found" });

        if (habit.history.includes(date)) habit.history = habit.history.filter(d => d !== date);
        else habit.history.push(date);

        const stats = calculateStats(habit.history, date);
        habit.completed = stats.completed;
        habit.streak = stats.streak;

        await habit.save();
        res.json(habit); 
    } catch (error) {
        res.status(500).json({ error: "Could not toggle habit" });
    }
});

app.delete('/habits/:id', async (req, res) => {
    try {
        await Habit.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (error) {
        res.status(500).json({ error: "Could not delete" });
    }
});
app.put('/update-password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  try {
    // 1. Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Check if old password matches
    // (Note: If you used bcrypt for hashing, use bcrypt.compare here)
    if (user.password !== oldPassword) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    // 3. Save the new password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error updating password" });
  }
});


app.listen(5000, '0.0.0.0', () => console.log("🚀 Auth Server running on port 5000"));