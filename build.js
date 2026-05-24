const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const POSTS_SRC = path.join(__dirname, 'content', 'posts');
const NOTES_SRC = path.join(__dirname, 'content', 'notes');
const POSTS_DEST = path.join(__dirname, 'posts');
const NOTES_DEST = path.join(__dirname, 'notes');
const TEMPLATES_DIR = path.join(__dirname, 'templates');

// Ensure destination directories exist
if (!fs.existsSync(POSTS_DEST)) fs.mkdirSync(POSTS_DEST, { recursive: true });
if (!fs.existsSync(NOTES_DEST)) fs.mkdirSync(NOTES_DEST, { recursive: true });

function formatMonth(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildPosts() {
  if (!fs.existsSync(POSTS_SRC)) return;
  const postTemplatePath = path.join(TEMPLATES_DIR, 'post.html');
  const indexTemplatePath = path.join(TEMPLATES_DIR, 'posts-index.html');
  
  if (!fs.existsSync(postTemplatePath) || !fs.existsSync(indexTemplatePath)) return;
  
  const postTemplate = fs.readFileSync(postTemplatePath, 'utf-8');
  const indexTemplate = fs.readFileSync(indexTemplatePath, 'utf-8');

  const files = fs.readdirSync(POSTS_SRC).filter(f => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_SRC, file), 'utf-8');
    const { data, content } = matter(raw);
    const htmlContent = marked.parse(content);
    
    const slug = path.basename(file, '.md');
    const outPath = path.join(POSTS_DEST, `${slug}.html`);
    
    const tagsArr = data.tags ? (typeof data.tags === 'string' ? data.tags.split(',').map(t=>t.trim()) : data.tags) : [];
    const tagsHtml = tagsArr.map(t => `<a href="../posts.html?tag=${encodeURIComponent(t)}" class="tag">${t}</a>`).join('\n        ');
    
    // Calculate read time
    const words = content.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(words / 200)) + ' min read';

    let outHtml = postTemplate
      .replace(/\{\{TITLE\}\}/g, data.title || slug)
      .replace(/\{\{EXCERPT\}\}/g, data.excerpt || '')
      .replace(/\{\{DATE\}\}/g, formatDate(data.date))
      .replace(/\{\{READ_TIME\}\}/g, readTime)
      .replace(/\{\{TAGS\}\}/g, tagsHtml)
      .replace('{{CONTENT}}', htmlContent);

    fs.writeFileSync(outPath, outHtml);

    posts.push({
      slug,
      title: data.title || slug,
      date: data.date,
      dateFormatted: formatDate(data.date),
      month: formatMonth(data.date),
      excerpt: data.excerpt || '',
      tags: tagsArr
    });
  }

  // Sort posts by date descending
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Generate home page index.html
  const homeTemplatePath = path.join(TEMPLATES_DIR, 'index.html');
  if (fs.existsSync(homeTemplatePath)) {
    const homeTemplate = fs.readFileSync(homeTemplatePath, 'utf-8');
    const latestPosts = posts.slice(0, 3);
    const latestPostsHtml = latestPosts.map(post => {
      const d = new Date(post.date);
      const formattedMonth = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return `<a href="posts/${post.slug}.html" class="post-teaser">
          <span class="post-teaser__title">${post.title}</span>
          <span class="post-teaser__date">${formattedMonth}</span>
        </a>`;
    }).join('\n        ');
    
    const finalHome = homeTemplate.replace('{{LATEST_POSTS}}', latestPostsHtml);
    fs.writeFileSync(path.join(__dirname, 'index.html'), finalHome);
  }

  // Generate posts.html list
  let postsListHtml = '';
  let currentYear = null;

  for (const post of posts) {
    const year = new Date(post.date).getFullYear();
    if (year !== currentYear) {
      if (currentYear !== null) postsListHtml += `        </div>\n\n`; // close previous year group
      postsListHtml += `        <!-- ${year} -->\n`;
      postsListHtml += `        <div class="year-group fade-in" data-year="${year}">\n`;
      postsListHtml += `          <p class="year-group__label">${year}</p>\n\n`;
      currentYear = year;
    }

    postsListHtml += `          <a href="posts/${post.slug}.html" class="post-card" data-tags="${post.tags.join(',')}" data-month="${post.month}">
            <div class="post-card__header">
              <span class="post-card__title">${post.title}</span>
              <span class="post-card__date">${post.dateFormatted}</span>
            </div>
            <p class="post-card__excerpt">${post.excerpt}</p>
            <div class="post-card__tags">
              ${post.tags.map(t => `<span class="tag">${t}</span>`).join('\n              ')}
            </div>
          </a>\n\n`;
  }
  if (currentYear !== null) postsListHtml += `        </div>\n\n`;

  const finalIndex = indexTemplate.replace('{{POSTS_CONTENT}}', postsListHtml);
  fs.writeFileSync(path.join(__dirname, 'posts.html'), finalIndex);
  console.log(`Built ${posts.length} posts.`);
}

function buildNotes() {
  if (!fs.existsSync(NOTES_SRC)) return;
  const files = fs.readdirSync(NOTES_SRC).filter(f => f.endsWith('.md'));
  
  const indexJson = { notes: [], links: [] };

  for (const file of files) {
    const raw = fs.readFileSync(path.join(NOTES_SRC, file), 'utf-8');
    const { data, content } = matter(raw);
    const htmlContent = marked.parse(content);
    
    const slug = path.basename(file, '.md');
    indexJson.notes.push(slug);
    
    if (data.connections) {
      const connections = Array.isArray(data.connections) 
        ? data.connections 
        : data.connections.split(',').map(c=>c.trim());
      for (const target of connections) {
        indexJson.links.push({ source: slug, target });
      }
    }

    const noteObj = {
      id: slug,
      title: data.title || slug,
      category: data.category || 'General',
      content: htmlContent
    };

    fs.writeFileSync(path.join(NOTES_DEST, `${slug}.json`), JSON.stringify(noteObj, null, 2));
  }

  fs.writeFileSync(path.join(NOTES_DEST, 'index.json'), JSON.stringify(indexJson, null, 2));
  console.log(`Built ${indexJson.notes.length} notes.`);
}

buildPosts();
buildNotes();
