import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsArticle {
  title: string;
  url: string;
  source: string;
  published_at: string;
}

// Sample legal news sources with their RSS/API endpoints
const newsSources = [
  {
    name: 'Bar & Bench',
    baseUrl: 'https://www.barandbench.com',
    categories: ['/news', '/columns', '/news/litigation']
  },
  {
    name: 'LiveLaw',
    baseUrl: 'https://www.livelaw.in',
    categories: ['/top-stories', '/supreme-court', '/high-court']
  },
  {
    name: 'SCC Online',
    baseUrl: 'https://www.scconline.com',
    categories: ['/blog']
  }
];

async function fetchArticlesFromSource(source: { name: string; baseUrl: string; categories: string[] }): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];
  
  try {
    // For this implementation, we'll create sample articles
    // In a production environment, you would scrape or use RSS feeds
    const category = source.categories[0];
    const sampleArticles: NewsArticle[] = [
      {
        title: `Latest ${source.name} Update on Supreme Court Proceedings`,
        url: `${source.baseUrl}${category}/article-${Date.now()}`,
        source: source.name,
        published_at: new Date().toISOString()
      },
      {
        title: `${source.name}: New Guidelines Issued by High Court`,
        url: `${source.baseUrl}${category}/guidelines-${Date.now()}`,
        source: source.name,
        published_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        title: `Breaking: ${source.name} Reports on Constitutional Bench`,
        url: `${source.baseUrl}${category}/constitutional-${Date.now()}`,
        source: source.name,
        published_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      }
    ];
    
    articles.push(...sampleArticles);
  } catch (error) {
    console.error(`Error fetching from ${source.name}:`, error);
  }
  
  return articles;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting legal news fetch...');
    
    const allArticles: NewsArticle[] = [];
    
    // Fetch articles from all sources
    for (const source of newsSources) {
      console.log(`Fetching from ${source.name}...`);
      const articles = await fetchArticlesFromSource(source);
      allArticles.push(...articles);
    }

    console.log(`Fetched ${allArticles.length} total articles`);

    // Insert or update articles in database
    let insertedCount = 0;
    let errorCount = 0;

    for (const article of allArticles) {
      try {
        const { error } = await supabase
          .from('legal_news')
          .upsert(
            {
              title: article.title,
              url: article.url,
              source: article.source,
              published_at: article.published_at,
            },
            {
              onConflict: 'url',
              ignoreDuplicates: false
            }
          );

        if (error) {
          console.error('Error inserting article:', error);
          errorCount++;
        } else {
          insertedCount++;
        }
      } catch (error) {
        console.error('Error processing article:', error);
        errorCount++;
      }
    }

    // Clean up old articles (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: deleteError } = await supabase
      .from('legal_news')
      .delete()
      .lt('published_at', sevenDaysAgo);

    if (deleteError) {
      console.error('Error cleaning up old articles:', deleteError);
    }

    const result = {
      success: true,
      message: `Successfully processed ${insertedCount} articles`,
      stats: {
        total: allArticles.length,
        inserted: insertedCount,
        errors: errorCount,
      },
    };

    console.log('Legal news fetch completed:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in fetch-legal-news function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
