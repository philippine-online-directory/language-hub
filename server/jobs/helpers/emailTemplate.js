export function wordOfTheDayTemplate(formattedDate, word, language, definition, example) {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #F6F4EF;
            margin: 0;
            padding: 20px;
          }
          .card {
            background: #ffffff;
            border-radius: 20px;
            border: 1px solid rgba(229, 231, 235, 0.6);
            padding: 10px;
            max-width: 640px;
            margin: auto;
            box-shadow: 0 12px 32px rgba(192, 118, 58, 0.15);
          }
          .header {
            text-align: center;
            background: #C0763A;
            color: #ffffff;
            padding: 20px;
            border-radius: 16px 16px 0 0;
            font-family: 'Fraunces', serif;
            font-size: 24px;
            font-weight: 600;
          }
          .intro {
            font-size: 16px;
            line-height: 24px;
            color: #6B7280;
            margin: 24px 0;
            text-align: center;
          }
          .divider {
            border: none;
            border-top: 2px solid #C0763A;
            margin: 24px 0;
          }
          h1 {
            font-family: 'Fraunces', serif;
            font-size: 32px;
            font-weight: 600;
            color: #1F2937;
            margin-bottom: 8px;
            padding-left: 5px;
          }
          .language {
            font-size: 16px;
            color: #6B7280;
            margin-bottom: 16px;
            padding-left: 5px;
          }
          .definition {
            font-size: 18px;
            line-height: 28px;
            color: #333;
            margin-bottom: 16px;
            padding-left: 10px;
          }
          .example {
            font-style: italic;
            color: #555;
            border-left: 3px solid #C0763A;
            margin: 0 auto;
            padding-left: 18px;
            margin-left: 10px;
          }
          .cta {
            display: inline-block;
            margin-top: 24px;
            padding: 12px 20px;
            background: #C0763A;
            color: #ffffff !important;
            text-decoration: none !important;
            border-radius: 8px;
            font-weight: 600;
          }
          .footer {
            margin-top: 32px;
            font-size: 14px;
            color: #6B7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">Philippine Online Directory</div>
          <div class="intro">
            We are pleased to present the Word of the Day for <strong>${formattedDate}</strong>.  
            May this entry help preserve and celebrate the diverse languages of the Philippines.
          </div>
          <hr class="divider" />
          <h1>${word}</h1>
          <div class="language">Language: ${language}</div>
          <div class="definition">${definition}</div>
          <div class="example">${example}</div>
          <div style="text-align:center;">
            <a href="http://localhost:5173" class="cta">Explore More Words</a>
          </div>
          <div class="footer">
            Philippine Online Directory — dedicated to keeping our languages alive
          </div>
        </div>
      </body>
    </html>
  `;
}




export function checkWordOfTheDayTemplate() {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #F6F4EF;
            margin: 0;
            padding: 20px;
          }
          .card {
            background: #ffffff;
            border-radius: 20px;
            border: 1px solid rgba(229, 231, 235, 0.6);
            padding: 10px;
            max-width: 640px;
            margin: auto;
            box-shadow: 0 12px 32px rgba(192, 118, 58, 0.15);
          }
          .header {
            text-align: center;
            background: #C0763A;
            color: #ffffff;
            padding: 20px;
            border-radius: 16px 16px 0 0;
            font-family: 'Fraunces', serif;
            font-size: 24px;
            font-weight: 600;
          }
          .intro {
            font-size: 16px;
            line-height: 24px;
            color: #6B7280;
            margin: 20px 0;
            text-align: center;
          }
          h1 {
            font-family: 'Fraunces', serif;
            font-size: 32px;
            font-weight: 600;
            color: #1F2937;
            margin-bottom: 8px;
            padding-left: 5px;
            text-align: center;
          }
          .cta {
            display: inline-block;
            margin-top: 24px;
            padding: 12px 20px;
            background: #C0763A;
            color: #ffffff !important;
            text-decoration: none !important;
            border-radius: 8px;
            font-weight: 600;
          }
          .footer {
            margin-top: 22px;
            font-size: 14px;
            color: #6B7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            Philippine Online Directory
          </div>

          <h1>Don’t Miss Today’s Word!</h1>

          <div class="intro">
            This is a friendly reminder to check today’s Word of the Day if you haven’t already. Take a moment to discover something new and help keep our Philippine languages alive.
          </div>

          <div style="text-align:center;">
            <a href="http://localhost:5173" class="cta">View Today’s Word</a>
          </div>

          <div class="footer">
            Philippine Online Directory — dedicated to preserving and celebrating our languages
          </div>
        </div>
      </body>
    </html>
  `;
}
