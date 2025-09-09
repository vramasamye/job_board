'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { ThemeToggle } from '@/components/theme-toggle';

interface Job {
  id: string;
  title: string;
  description: string;
  company: string;
  url: string;
  pubDate: string;
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .order('pubDate', { ascending: false });

      if (data) {
        setJobs(data);
        setFilteredJobs(data);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    const lowercasedFilter = filter.toLowerCase();
    const filtered = jobs.filter((job) => {
      return (
        job.title.toLowerCase().includes(lowercasedFilter) ||
        (job.description && job.description.toLowerCase().includes(lowercasedFilter))
      );
    });
    setFilteredJobs(filtered);
  }, [filter, jobs]);

  return (
    <div className="container mx-auto p-4">
      <header className="text-center py-8 relative">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
        <h1 className="text-4xl font-bold">Job Board</h1>
        <p className="text-muted-foreground">
          Find your next remote job in software development.
        </p>
      </header>
      <main>
        <div className="mb-8">
          <Input
            type="text"
            placeholder="Filter by title or description..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Date Posted</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.company}</TableCell>
                  <TableCell>{job.title}</TableCell>
                  <TableCell>
                    {new Date(job.pubDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild>
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Job
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}