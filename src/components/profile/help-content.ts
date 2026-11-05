export type Faq = { q: string; a: string };
export type HelpSection = { title: string; faqs?: Faq[]; body?: string; bullets?: string[] };

export const HELP_VIDEO = 'https://youtu.be/zKUYGTr9vMg';

export const helpIntro = [
  'Need a hand? We are here to help you flick your mood like a pro.',
  'Welcome to the Moodflik Help Center -- your one-stop shop for all things green, red, and everything in between. Whether you are just getting started, having a tech hiccup, or wondering how to protect your vibe, you will find answers here.',
  'If you do not see what you are looking for, our Support Team is just a DM away!',
];

export const helpSections: HelpSection[] = [
  {
    title: 'Getting started',
    faqs: [
      {
        q: 'What is Moodflik?',
        a: 'Moodflik is a social micro-blogging app where you share your mood (positive or negative) with a color-coded post -- green for good vibes, red for bad vibes. You pick one of five mood prompts, hit post, and let the emotional dialogue begin.',
      },
      {
        q: 'How do I sign up?',
        a: 'Download the app, create a username, add an optional profile pic and bio, and you are good to go.',
      },
      {
        q: 'What are the positive and negative mood prompts?',
        a: 'Positive: I am loving / I am excited / I am so obsessed with / I am motivated / I am grateful\nNegative: I dislike / I am frustrated / I am angry / I am upset / I am p****d',
      },
      {
        q: 'What is the Why button?',
        a: 'It is your chance to tell the story behind your mood. Share more context, and let people engage deeper by liking, disliking, or commenting on your Why.',
      },
      {
        q: '(For Android 12+ users only) How do I enable the app to open contents with links that have been sent to me from other platforms?',
        a: 'Please watch the short video linked below, which presents the simple steps to follow.',
      },
    ],
  },
  {
    title: 'Posting and interacting',
    faqs: [
      {
        q: 'How do I post a mood?',
        a: 'Tap the green or red status bar, pick your prompt, type what you are feeling, and hit post.',
      },
      {
        q: 'Can I edit or delete a post?',
        a: 'Yes. Go to your post, tap the three dots (...), and choose Edit or Delete.',
      },
      {
        q: 'Who can see my posts?',
        a: 'By default, friends and followers can see your moods. You can change your privacy settings anytime under Settings > Account and Privacy.',
      },
      {
        q: 'How do I like, dislike, or comment on a post?',
        a: 'Tap the Moodflik logo once to like a post and the outer part of the heart-shaped logo turns green while the word "agree" floats up. Double tap to dislike; the inner heart glows red and "disagree" floats up. Tap the speech bubble on any post to comment.',
      },
      {
        q: 'What is the difference between posting a mood and posting a Why?',
        a: 'Your mood sets the tone. The Why is optional, deeper context you can add later -- and it also gets its own likes, dislikes, and comments.',
      },
    ],
  },
  {
    title: 'Account and privacy',
    faqs: [
      {
        q: 'How do I change my username, edit my bio, or change my email address?',
        a: 'Head to Settings > Edit profile and update your details.',
      },
      {
        q: 'How do I make my account private?',
        a: 'Go to Settings > Privacy and toggle "Make my posts public by default" to OFF. Only approved followers can see your moods.',
      },
      {
        q: 'How do I block or mute someone?',
        a: 'Visit their profile or post, tap the three dots (...), and choose Block or Mute. You can also manage both lists from Settings.',
      },
      { q: 'Will they know I blocked them?', a: 'Nope. Blocking is private.' },
      {
        q: 'Can I delete my account?',
        a: 'Absolutely. Go to Settings > Delete or deactivate account.',
      },
    ],
  },
  {
    title: 'Notifications',
    faqs: [
      {
        q: 'How do I control notifications?',
        a: 'Settings > Notifications lets you toggle on or off notifications for likes, comments, Whys, and more.',
      },
      {
        q: 'Can I get a weekly mood summary?',
        a: 'Yes. Turn it on in Settings > Notifications.',
      },
    ],
  },
  {
    title: 'Troubleshooting',
    faqs: [
      {
        q: 'I cannot log in -- what do I do?',
        a: 'Try resetting your password on the login screen. Still stuck? Contact Support.',
      },
      {
        q: 'My feed is not loading. Help!',
        a: 'Check your internet connection, then close and reopen the app. If it persists, let us know.',
      },
      {
        q: 'I found a bug or glitch -- how do I report it?',
        a: 'Go to Contact Us > Report a Problem or DM our Support Team.',
      },
    ],
  },
  {
    title: 'For businesses',
    faqs: [
      {
        q: 'How can my brand advertise on Moodflik?',
        a: 'We would love to chat. Email us at info@moodflik.com to learn about mood-targeted campaigns.',
      },
      {
        q: "Can businesses see individual users' moods?",
        a: 'No. We only share aggregate, anonymised insights. Your moods stay personal.',
      },
    ],
  },
  {
    title: 'Safety and community',
    faqs: [
      {
        q: 'What if someone is harassing me?',
        a: 'Block and/or report them immediately via their profile or post. Our Trust and Safety team reviews all reports promptly.',
      },
      {
        q: 'Does Moodflik moderate content?',
        a: 'Yes. We have community guidelines; repeated violations can result in bans.',
      },
      {
        q: 'How do I report inappropriate content?',
        a: 'Tap the three dots (...) on the post and select Report. Easy.',
      },
    ],
  },
  {
    title: 'Flag and report',
    body: 'The following are unwelcome activities on Moodflik. Any of these should be reported to us immediately for review and action.',
    bullets: [
      'Bullying',
      'Grooming',
      'Spamming',
      'False advertisement',
      'Fake or under-aged accounts (under the age of 13)',
      'Inciting of hate and violence or discrimination',
      'False and/or disparaging posts or comments about other members on Moodflik',
    ],
  },
  {
    title: 'Still need help?',
    body: 'We are here for you. Contact us anytime:\nEmail: info@moodflik.com\nIn-App Chat: Go to our Contact Us page\nLearn more: Check out our Community Guidelines and Privacy Policy.',
  },
];
