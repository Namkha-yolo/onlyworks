// frontend/pages/api/jobs/index.js
import dbConnect from '../../../lib/dbConnect';
import Job from '../../../models/Job';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const jobs = await Job.find().sort({ createdAt: -1 });
      return res.status(200).json(jobs);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  }

  if (req.method === 'POST') {
    try {
      const job = await Job.create(req.body);
      return res.status(201).json(job);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
