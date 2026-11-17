# UX Roaster

A web app that audits UI screenshots, live websites, and multi-step user flows for usability and accessibility issues. Built using Jakob Nielsen’s 10 Usability Heuristics and WCAG contrast guidelines, powered by Gemini 2.5 Flash.

Try the prototype in Google AI Studio: (https://ai.studio/apps/7e6b7102-0087-4cc5-9b85-f500848d9ba4) *(requires Google sign-in)*

## Screenshots

<img width="955" height="894" alt="image" src="https://github.com/user-attachments/assets/6ac0c5eb-53de-4dff-86c0-09115fc823a9" />
<img width="1919" height="933" alt="image" src="https://github.com/user-attachments/assets/e1bd5e83-9cf5-4d4a-8061-04014af2be3f" />
<img width="1916" height="944" alt="image" src="https://github.com/user-attachments/assets/b93343c3-88ac-4a70-ad51-58e4cc0df309" />


## What it does

- **Single Screen Audit:** Upload a screenshot or wireframe to get a heuristic breakdown and contrast check.
- **Website URL Check:** Paste a live URL to capture a preview and audit its layout and copy.
- **Multi-Screen Flow:** Upload 2 to 5 screens in sequence to check navigation consistency across a full user journey.
- **Visual Error Spotlight:** Places numbered pins directly over the problem areas on your screen with a step-by-step walkthrough.
- **Before & After Fixes:** Suggests plain-English copy rewrites and WCAG-compliant color fixes you can copy with one click.
- **Built-in Demo Samples:** Includes sample checkout and login screens so you can test the tool without uploading your own images.

## Tech Stack

- React & TypeScript
- Tailwind CSS
- Google Gemini API (`gemini-2.5-flash`)
- Prototyped in Google AI Studio

## How I built it

I used Google AI Studio to speed up the frontend setup while I focused on the UX flow, heuristic evaluation criteria, and debugging:

- **Structured Output:** Configured Gemini's vision prompt to return bounding-box coordinates alongside heuristic severity ratings so errors map accurately onto the uploaded image.
- **Handling API Errors & Large Images:** Added client-side image resizing via HTML Canvas so high-res screenshots don't fail on upload, plus retry logic for 503 API timeouts.
- **Navigation State:** Added breadcrumb navigation and a state-preserving back button so users don't lose their uploaded screens when moving between the scorecard and the error spotlight.

## Run it locally

1. Clone the repo:
   ```bash
   git clone [https://github.com/YOUR_USERNAME/ux-roaster-ai.git](https://github.com/YOUR_USERNAME/ux-roaster-ai.git)
   cd ux-roaster-ai
##  Running Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR_GITHUB_USERNAME/ux-roaster-ai.git](https://github.com/YOUR_GITHUB_USERNAME/ux-roaster-ai.git)
   cd ux-roaster-ai
