export type Reason = { id: number; title: string; reveal: string; followUp?: string };

export const DELETE_REASONS: Reason[] = [
  {
    id: 1,
    title: "I'm not enjoying the app anymore.",
    reveal:
      'Let us tailor your feed -- follow new moods, mute noise, and rediscover the joy of sharing.',
    followUp:
      "Yay! Let's turn your Moodflik into a mood-lift. We're thrilled you're sticking with us -- like your favorite snack during a Netflix binge.",
  },
  {
    id: 2,
    title: 'I spend too much time here.',
    reveal: 'Try our time reminder settings and mindfulness nudges -- your mood, your pace.',
    followUp:
      "You're taking control of your screen time, and we're proud of you. Balance is beautiful -- and you still get to stay awesome on Moodflik!",
  },
  {
    id: 3,
    title: "I don't feel seen or heard.",
    reveal:
      "Why not join our feedback loop or try our new 'mood match' feature to find people who vibe with you. Let's also boost your reach! You can share a Mood Challenge post -- people love reacting to those!",
    followUp:
      'Everyone deserves to be heard -- including you. Thanks for letting us try to do better. You just made Moodflik brighter.',
  },
  {
    id: 4,
    title: "I'm overwhelmed by negativity.",
    reveal:
      "Use our 'positivity filter' or block certain users that may be negatively impacting your moods -- protect your vibe while staying connected.",
    followUp:
      "Your peace matters. Thanks for letting us help you protect it -- and for staying with us. You're kind of a big deal around here.",
  },
  {
    id: 5,
    title: 'I just need a break.',
    reveal:
      "Take a breather with account deactivation. We'll keep your mood memories safe, your followers and those who are following you, so you won't need to start all over again when you're ready to return.",
    followUp:
      'Breaks are healthy -- we respect that. Your Moodflik home will be here, waiting with open arms and digital cookies.',
  },
  {
    id: 6,
    title: 'I still want to delete my account.',
    reveal:
      "We're officially in our feelings now. Thank you for being part of Moodflik -- even if just for a season. Wishing you brighter moods ahead. Come back anytime -- we'll keep the (green and red) lights on for you. We'd be so grateful if you could drop us a line at info@moodflik.com to let us know why you deleted your account and what we could be doing better.\n\nThank you once again, from everyone at Moodflik.",
  },
];
