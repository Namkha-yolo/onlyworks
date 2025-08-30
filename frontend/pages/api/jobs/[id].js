// frontend/pages/api/jobs/[id].js
import dbConnect from '../../../lib/dbConnect';
import Job from '../../../models/Job';

export default async function handler(req, res) {
  const { id } = req.query; // the job ID from the URL
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const job = await Job.findById(id);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      return res.status(200).json(job);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch job' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const updatedJob = await Job.findByIdAndUpdate(id, req.body, { new: true });
      if (!updatedJob) return res.status(404).json({ error: 'Job not found' });
      return res.status(200).json(updatedJob);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await Job.findByIdAndDelete(id);
      return res.status(204).end();
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete job' });
    }
  }

  // If the request method is not GET, PUT, or DELETE
  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
