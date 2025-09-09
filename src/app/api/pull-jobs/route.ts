import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { supabase } from '@/lib/supabaseClient';

interface ExtendedRSSItem extends Parser.Item {
  company?: string;
  'dc:creator'?: string;
}

const parser = new Parser();

const feeds = [
  'https://remotive.com/remote-jobs/feed/software-dev',
  'https://weworkremotely.com/remote-jobs.rss',
];

// Enhanced keywords for better job filtering
const keywords = [
  // Full Stack variations
  'full-stack',
  'fullstack',
  'full stack',
  
  // AI/ML/Deep Learning variations
  'artificial intelligence',
  'machine learning',
  'deep learning',
  'neural network',
  'computer vision',
  'natural language processing',
  'nlp',
  'ai',
  'ml',
  'deeplearning',
  'tensorflow',
  'pytorch',
  'keras',
  'scikit-learn',
  'opencv',
  'transformers',
  'llm',
  'large language model',
  'generative ai',
  'genai',
  
  // Data Science variations
  'data scientist',
  'data science',
  'data analysis',
  'data analytics',
  'data engineer',
  'data engineering',
  'machine learning engineer',
  'ml engineer',
  'ai engineer',
  'research scientist',
  'applied scientist',
  'quantitative analyst',
  'statistician',
  'business intelligence',
  'predictive analytics',
  'big data',
  
  // Common tools and frameworks
  'python',
  'r programming',
  'sql',
  'pandas',
  'numpy',
  'jupyter',
  'databricks',
  'spark',
  'hadoop',
  'tableau',
  'power bi',
  'statistical modeling',
  'predictive modeling',
];

function getMatchedKeywords(text: string, keywords: string[]): string[] {
  const lowerText = text.toLowerCase();
  return keywords.filter(keyword => {
    const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
    return regex.test(lowerText);
  });
}

function isJobRelevant(item: ExtendedRSSItem): boolean {
  const title = (item.title || '').toLowerCase();
  const description = (item.content || '').toLowerCase();
  
  // Priority matching - focus on title first as it's more accurate
  const titleMatchedKeywords = getMatchedKeywords(title, keywords);
  
  // If title matches, it's definitely relevant
  if (titleMatchedKeywords.length > 0) {
    console.log(`🎯 Title keywords matched for "${item.title}":`, titleMatchedKeywords.join(', '));
    return true;
  }
  
  // Secondary check: look for keywords in description but be more selective
  const descriptionMatchedKeywords = getMatchedKeywords(description, keywords);
  
  // Require at least 2 keyword matches in description if no title match
  if (descriptionMatchedKeywords.length >= 2) {
    console.log(`📝 Description keywords matched for "${item.title}":`, descriptionMatchedKeywords.join(', '));
    return true;
  }
  
  return false;
}

function getCompanyName(item: ExtendedRSSItem): string {
  if (item.company) {
    return item.company;
  }
  if (item['dc:creator']) {
    return item['dc:creator'];
  }
  if (item.title && item.title.includes(':')) {
    return item.title.split(':')[0].trim();
  }
  if (item.content) {
    const match = item.content.match(/<b>Company:<\/b>\s*(.*?)<br>/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return 'N/A';
}

function formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    const monthStr = monthNames[date.getMonth()];
    return `${day}-${monthStr}-${year}`;
}

export async function GET() {
  console.log('Pulling jobs...');
  try {
    for (const feedUrl of feeds) {
      console.log(`Processing feed: ${feedUrl}`);
      const feed = await parser.parseURL(feedUrl);
      console.log(`Found ${feed.items.length} items in the feed.`);

      for (const item of feed.items as ExtendedRSSItem[]) {
        if (item.pubDate) {
            const jobDate = new Date(item.pubDate);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            if (jobDate < thirtyDaysAgo) {
                console.log(`❌ Skipping old job: ${item.title} (published on ${jobDate.toDateString()})`);
                continue;
            }
        }

        if (!isJobRelevant(item)) {
          console.log(`❌ Skipping irrelevant job: ${item.title}`);
          continue;
        }

        console.log('✅ Processing relevant job:', item.title);
        const { title, link: url, content, pubDate, guid } = item;

        // Skip if the job is already in the database
        const { data: existingJob } = await supabase
          .from('jobs')
          .select('guid')
          .eq('guid', guid)
          .single();

        if (existingJob) {
          console.log(`Job with guid ${guid} already exists. Skipping.`);
          continue;
        }

        const company = getCompanyName(item);

        const publicationDate = pubDate ? new Date(pubDate) : new Date();
        const formattedDate = formatDate(publicationDate);
        const descriptionWithDate = `<p><strong>Published on:</strong> ${formattedDate}</p><br>${content || ''}`;

        const { error } = await supabase.from('jobs').insert([
          {
            title,
            url,
            description: descriptionWithDate,
            pubDate: publicationDate,
            guid,
            company,
          },
        ]);

        if (error) {
          console.error('Error inserting job:', error);
        } else {
          console.log(`Inserted job: ${title}`);
        }
      }
    }

    console.log('Finished pulling jobs.');
    return NextResponse.json({ message: 'Jobs pulled successfully' });
  } catch (error) {
    console.error('Error pulling jobs:', error);
    return NextResponse.json(
      { message: 'Error pulling jobs' },
      { status: 500 }
    );
  }
}
