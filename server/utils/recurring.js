import Transaction from '../models/Transaction.js';
import { addInterval, todayUTC } from './dates.js';

// Creates every recurring occurrence that has become due, then advances the template's nextRunDate.
// Runs on demand (no cron needed). The updateOne guard makes it safe if two requests race.
export async function processRecurring(userId) {
  const today = todayUTC();
  const templates = await Transaction.find({
    user: userId,
    isRecurring: true,
    nextRunDate: { $ne: null, $lte: today },
  });

  for (const t of templates) {
    const anchorDay = t.date.getUTCDate();
    const docs = [];
    let next = t.nextRunDate;
    let guard = 0;
    while (next <= today && guard++ < 1000) {
      docs.push({
        user: userId,
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: next,
        recurringSource: t._id,
      });
      next = addInterval(next, t.frequency, anchorDay);
    }
    if (!docs.length) continue;

    const claimed = await Transaction.updateOne(
      { _id: t._id, nextRunDate: t.nextRunDate },
      { $set: { nextRunDate: next } }
    );
    if (claimed.modifiedCount === 1) await Transaction.insertMany(docs);
  }
}
