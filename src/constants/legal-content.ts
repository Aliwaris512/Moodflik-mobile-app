/**
 * Static page copy, kept word for word from the original Moodflik app.
 * Do not reword, shorten or "improve" it.
 *
 * Block kinds: h = section heading, q = bold question / lead-in, p = paragraph,
 * li = bullet, video = tappable YouTube thumbnail (text is the video id).
 */
export type ContentBlock = readonly ['h' | 'q' | 'p' | 'li' | 'video', string];

export const CONTACT_EMAIL = 'info@moodflik.com';

export const contactIntro: string[] = [
  `We are always happy to hear from both our users and also non-users of Moodflik; should you have any questions relating to this platform, questions for staff members, requests from the press, any form of dissatisfaction in using our platform, feeling the need to report abuse or an abuser discovered here or perhaps just wishing to provide us with feedback on your experiences in using either our web or mobile application or friendly and technical suggestions of what we can do to continue to improve our platform.`,
  `For whatever the reason, please do not hesitate to contact us with the form below, or you may send us an email on info@moodflik.com and a member of our team will endeavour to get back to you as soon as possible.`,
  `Thanks,`,
  `The Team at Moodflik`,
];

export const aboutUs: ContentBlock[] = [
  [
    'p',
    `Moodflik was developed based on the fact that regardless of who we are, where we are from or what we believe, we all share one commonality – we all see, experience and react to things and events that we either love or dislike at any given moment in our lives; though we may sometimes go through these life experiences sub-consciously. We have also come to understand that most of the communications exchanged on many social media platforms can really be summarised into these two areas, thus filtering out irrelevant content.`,
  ],
  [
    'p',
    `It is our mission here at Moodflik to provide a fun, unique, engaging, diverse and safe platform for people from various walks of life with different values, opinions and perspectives to share their daily moments of joy and happiness as well as times of frustrations and dissatisfactions in the forms of likes and dislikes respectively and respectfully. We believe that sharing a balance of these two dichotomies of life provides a more comprehensive and candid overview of how we truly are both inwardly and outwardly, by expressing these constantly changing dual aspects of our daily reactions to life’s events we can better understand how our Moods flik (sorry, couldn’t resist :).`,
  ],
  [
    'p',
    `We have come a very long way to make this platform a reality despite the numerous obstacles and challenges that have come our way, we maintained a can-do and never-give-up attitude because we are confident that Moodflik will play a key role in shaping a new approach to dialogue and purposeful content sharing on social media. Currently (to our knowledge), there are no other social media platforms offering this form of micro-blogging, so we hope you enjoy this new and unique experience with us as we continue in our plans to grow bigger, better and bolder.`,
  ],
  ['p', `P.s Yes, we are aware that flik is not a word, but we are currently loving it ;)`],
];

export const help: ContentBlock[] = [
  ['h', `Help and FAQ`],
  ['p', `Need a hand? We are here to help you flick your mood like a pro.`],
  [
    'p',
    `Welcome to the Moodflik Help Center -- your one-stop shop for all things green, red, and everything in between. Whether you are just getting started, having a tech hiccup, or wondering how to protect your vibe, you will find answers here.`,
  ],
  ['p', `If you do not see what you are looking for, our Support Team is just a DM away!`],

  ['h', `Getting started`],
  ['q', `Q: What is Moodflik?`],
  [
    'p',
    `A: Moodflik is a social micro-blogging app where you share your mood (positive or negative) with a color-coded post -- green for good vibes, red for bad vibes. You pick one of five mood prompts, hit post, and let the emotional dialogue begin.`,
  ],
  ['q', `Q: How do I sign up?`],
  [
    'p',
    `A: Download the app, create a username, add an optional profile pic and bio, and you are good to go.`,
  ],
  ['q', `Q: What are the positive and negative mood prompts?`],
  [
    'p',
    `A: Positive: I am loving / I am excited / I am so obsessed with / I am motivated / I am grateful
Negative: I dislike / I am frustrated / I am angry / I am upset / I am p****d`,
  ],
  ['q', `Q: What is the Why button?`],
  [
    'p',
    `A: It is your chance to tell the story behind your mood. Share more context, and let people engage deeper by liking, disliking, or commenting on your Why.`,
  ],
  [
    'q',
    `Q: (For Android 12+ users only) How do I enable the app to open contents with links that have been sent to me from other platforms?`,
  ],
  ['p', `A: Please watch this short video which presents the simple steps to follow.`],
  ['video', `zKUYGTr9vMg`],

  ['h', `Posting and interacting`],
  ['q', `Q: How do I post a mood?`],
  [
    'p',
    `A: Tap the green or red status bar, pick your prompt, type what you are feeling, and hit post.`,
  ],
  ['q', `Q: Can I edit or delete a post?`],
  ['p', `A: Yes. Go to your post, tap the three dots (...), and choose Edit or Delete.`],
  ['q', `Q: Who can see my posts?`],
  [
    'p',
    `A: By default, friends and followers can see your moods. You can change your privacy settings anytime under Settings > Account and Privacy.`,
  ],
  ['q', `Q: How do I like, dislike, or comment on a post?`],
  [
    'p',
    `A: Tap the Moodflik logo once to like a post and the outer part of the heart-shaped logo turns green while the word "agree" floats up. Double tap to dislike; the inner heart glows red and "disagree" floats up. Tap the speech bubble on any post to comment.`,
  ],
  ['q', `Q: What is the difference between posting a mood and posting a Why?`],
  [
    'p',
    `A: Your mood sets the tone. The Why is optional, deeper context you can add later -- and it also gets its own likes, dislikes, and comments.`,
  ],

  ['h', `Account and privacy`],
  ['q', `Q: How do I change my username, edit my bio, or change my email address?`],
  ['p', `A: Head to menu > profile settings and edit your details.`],
  ['q', `Q: How do I make my account private?`],
  [
    'p',
    `A: Go to Settings > Account and privacy settings and toggle "Make my posts public by default" to OFF. Only approved followers can see your moods.`,
  ],
  ['q', `Q: How do I block or mute someone?`],
  [
    'p',
    `A: Visit their profile or post, tap the three dots (...), and choose Block or Mute. Learn more in our Block User guide.`,
  ],
  ['q', `Q: Will they know I blocked them?`],
  ['p', `A: Nope. Blocking is private.`],
  ['q', `Q: Can I delete my account?`],
  ['p', `A: Absolutely. Go to menu settings > Account and privacy settings > Delete account.`],

  ['h', `Notifications`],
  ['q', `Q: How do I control notifications?`],
  [
    'p',
    `A: Menu settings > Notifications lets you toggle on or off notifications for likes, comments, Whys, and more.`,
  ],
  ['q', `Q: Can I get a weekly mood summary?`],
  ['p', `A: Yes. Turn it on in Menu settings > Notifications.`],

  ['h', `Troubleshooting`],
  ['q', `Q: I cannot log in -- what do I do?`],
  ['p', `A: Try resetting your password on the login screen. Still stuck? Contact Support.`],
  ['q', `Q: My feed is not loading. Help!`],
  [
    'p',
    `A: Check your internet connection, then close and reopen the app. If it persists, let us know.`,
  ],
  ['q', `Q: I found a bug or glitch -- how do I report it?`],
  ['p', `A: Go to Contact Us > Report a Problem or DM our Support Team.`],

  ['h', `For businesses`],
  ['q', `Q: How can my brand advertise on Moodflik?`],
  [
    'p',
    `A: We would love to chat. Email us at info@moodflik.com to learn about mood-targeted campaigns.`,
  ],
  ['q', `Q: Can businesses see individual users' moods?`],
  ['p', `A: No. We only share aggregate, anonymised insights. Your moods stay personal.`],

  ['h', `Safety and community`],
  ['q', `Q: What if someone is harassing me?`],
  [
    'p',
    `A: Block and/or report them immediately via their profile or post. Our Trust and Safety team reviews all reports promptly.`,
  ],
  ['q', `Q: Does Moodflik moderate content?`],
  ['p', `A: Yes. We have community guidelines; repeated violations can result in bans.`],
  ['q', `Q: How do I report inappropriate content?`],
  ['p', `A: Tap the three dots (...) on the post and select Report. Easy.`],

  ['h', `Flag and report`],
  ['p', `The following are unwelcome activities on Moodflik:`],
  ['li', `Bullying`],
  ['li', `Grooming`],
  ['li', `Spamming`],
  ['li', `False advertisement`],
  ['li', `Fake or under-aged accounts (under the age of 13)`],
  ['li', `Inciting of hate and violence or discrimination`],
  ['li', `False and/or disparaging posts or comments about other members on Moodflik`],
  ['p', `Any of these activities should be reported to us immediately for review and action.`],

  ['h', `Still need help?`],
  [
    'p',
    `We are here for you. Contact us anytime:
Email: info@moodflik.com
In-App Chat: Go to our Contact Us page
Learn more: Check out our Community Guidelines and Privacy Policy.`,
  ],

  ['h', `Feedback`],
  [
    'p',
    `We are constantly growing and seeking to improve. If you have found something we could do better or have new ideas, email us at info@moodflik.com.`,
  ],
  ['p', `Until then -- keep flicking your moods, and keep being you.`],
];

export const terms: ContentBlock[] = [
  ['h', `Terms and Conditions`],

  ['h', `1. Agreement to Terms`],
  [
    'p',
    `1.1 These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity (you), and Moodflik, located at Church Lane, Manchester, Greater manchester M9, United Kingdom  (us), concerning your access to and use of the moodflik (https://www.moodflik.com) website as well as any related applications (the Site).`,
  ],
  [
    'p',
    `The Site provides the following services:  A Micro-blogging network(Web and Mobile Application) where users can share their interests and dislikes. You agree that by accessing the Site and/or Services, you have read, understood, and agree to be bound by all of these Terms and Conditions.`,
  ],
  [
    'p',
    `If you do not agree with all of these Terms and Conditions, then you are prohibited from using the Site and Services and you must discontinue use immediately. We recommend that you print a copy of these Terms and Conditions for future reference.`,
  ],
  [
    'p',
    `1.2 The supplemental policies set out in Section 1.7 below, as well as any supplemental terms and condition or documents that may be posted on the Site from time to time, are expressly incorporated by reference.`,
  ],
  [
    'p',
    `1.3 We may make changes to these Terms and Conditions at any time. The updated version of these Terms and Conditions will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible. You are responsible for reviewing these Terms and Conditions to stay informed of updates. Your continued use of the Site represents that you have accepted such changes.`,
  ],
  [
    'p',
    `1.4 We may update or change the Site from time to time to reflect changes to our products, our users' needs and/or our business priorities.`,
  ],
  [
    'p',
    `1.5 Our site is directed to people residing both within and outside of the United Kingdom. The information provided on the Site is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country.`,
  ],
  [
    'p',
    `1.6 The Site is intended for users who are at least 13 years old. If you are under the age of 13, you are not permitted to register for the Site or use the Services without parental permission.By using the Website and Services and by agreeing to this Agreement you warrant and represent that you are at least 13 years of age. If you create an account on the Website, you are responsible for maintaining the security of your account and you are fully responsible for all activities that occur under the account and any other actions taken in connection with it. We may, but have no obligation to, monitor and review new accounts before you may sign in and start using the Services. Providing false contact information of any kind may result in the termination of your account. You must immediately notify us of any unauthorized uses of your account or any other breaches of security. We will not be liable for any acts or omissions by you, including any damages of any kind incurred as a result of such acts or omissions. We may suspend, disable, or delete your account (or any part thereof) if we determine that you have violated any provision of this Agreement or that your conduct or content would tend to damage our reputation and goodwill. If we delete your account for the foregoing reasons, you may not re-register for our Services. We may block your email address and Internet protocol address to prevent further registration.`,
  ],
  ['p', `1.7 Additional policies which also apply to your use of the Site include:`],
  [
    'p',
    `Our Privacy Notice, which sets out the terms on which we process any personal data we collect from you, or that you provide to us. By using the Site, you consent to such processing and you warrant that all data provided by you is accurate.
Our Cookie Policy, which sets out information about the cookies on the Site.`,
  ],

  ['h', `2. Acceptable Use`],
  [
    'p',
    `2.1 You may not access or use the Site for any purpose other than that for which we make the site and our services available. The Site may not be used in connection with any commercial endeavours except those that are specifically endorsed or approved by us.`,
  ],
  ['p', `2.2 As a user of this Site, you agree not to:`],
  ['li', `Use a buying agent or purchasing agent to make purchases on the Site`],
  [
    'li',
    `Make any unauthorized use of the Site, including collecting usernames and/or email addresses of users to send unsolicited email or creating user accounts under false pretences`,
  ],
  [
    'li',
    `Systematically retrieve data or other content from the Site to a compile database or directory without written permission from us`,
  ],
  ['li', `Use the Site to advertise or sell goods and services`],
  [
    'li',
    `Circumvent, disable, or otherwise interfere with security-related features of the Site, including features that prevent or restrict the use or copying of any content or enforce limitations on the use`,
  ],
  ['li', `Engage in unauthorized framing of or linking to the Site`],
  [
    'li',
    `Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords`,
  ],
  [
    'li',
    `Make improper use of our support services, or submit false reports of abuse or misconduct`,
  ],
  [
    'li',
    `Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools`,
  ],
  [
    'li',
    `Interfere with, disrupt, or create an undue burden on the Site or the networks and services connected to the Site`,
  ],
  ['li', `Attempt to impersonate another user or person, or use the username of another user`],
  ['li', `Sell or otherwise transfer your profile`],
  [
    'li',
    `Use any information obtained from the Site in order to harass, abuse, or harm another person`,
  ],
  [
    'li',
    `Use the Site or our content as part of any effort to compete with us or to create a revenue-generating endeavour or commercial enterprise`,
  ],
  [
    'li',
    `Decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Site`,
  ],
  ['li', `Attempt to access any portions of the Site that you are restricted from accessing`],
  ['li', `Harass, annoy, intimidate, or threaten any of our employees, agents, or other users`],
  ['li', `Use the Site to advertise or sell goods and services`],
  ['li', `Delete the copyright or other proprietary rights notice from any of the content`],
  [
    'li',
    `Copy or adapt the Site’s software, including but not limited to Flash, PHP, HTML, JavaScript, or other code`,
  ],
  [
    'li',
    `Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material that interferes with any party’s uninterrupted use and enjoyment of the Site, or any material that acts as a passive or active information collection or transmission mechanism`,
  ],
  [
    'li',
    `Use, launch, or engage in any automated use of the system, such as using scripts to send comments or messages, robots, scrapers, offline readers, or similar data gathering and extraction tools`,
  ],
  ['li', `Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Site`],
  ['li', `Use the Site in a manner inconsistent with any applicable laws or regulations`],
  [
    'li',
    `Threaten users with negative feedback or offering services solely to give positive feedback to users`,
  ],
  ['li', `Misrepresent experience, skills, or information about a User`],
  ['li', `Advertise products or services not intended by us`],
  [
    'li',
    `Falsely imply a relationship with us or another company with whom you do not have a relationship`,
  ],

  ['h', `3. Information you provide to us`],
  [
    'p',
    `.1 You represent and warrant that: (a) all registration information you submit will be true, accurate, current, and complete and relate to you and not a third party; (b) you will maintain the accuracy of such information and promptly update such information as necessary; (c) you will keep your password confidential and will be responsible for all use of your password and account; (d) you have the legal capacity and you agree to comply with these Terms and Conditions; and (e) you are not a minor in the jurisdiction in which you reside, or if a minor, you have received parental permission to use the Site.`,
  ],
  [
    'p',
    `If you know or suspect that anyone other than you knows your user information (such as an identification code or user name) and/or password you must promptly notify us at info@moodflik.com.`,
  ],
  [
    'p',
    `3.2 If you provide any information that is untrue, inaccurate, not current or incomplete, we may suspend or terminate your account. We may remove or change a user name you select if we determine that such user name is inappropriate.`,
  ],
  [
    'p',
    `3.3 As part of the functionality of the Site, you may link your account with online accounts you may have with third party service providers (each such account, a Third Party Account) by either: (a) providing your Third Party Account login information through the Site; or (b) allowing us to access your Third Party Account, as is permitted under the applicable terms and conditions that govern your use of each Third Party Account.`,
  ],
  [
    'p',
    `You represent that you are entitled to disclose your Third Party Account login information to us and/or grant us access to your Third Party Account without breach by you of any of the terms and conditions that govern your use of the applicable Third Party Account and without obligating us to pay any fees or making us subject to any usage limitations imposed by such third party service providers.`,
  ],
  [
    'p',
    `3.4 By granting us access to any Third Party Accounts, you understand that (a) we may access, make available and store (if applicable) any content that you have provided to and stored in your Third Party Account (the  "Social Network Content" ) so that it is available on and through the Site via your account, including without limitation any friend lists; and (b) we may submit and receive additional information to your Third Party Account to the extent you are notified when you link your account with the Third Party Account.`,
  ],
  [
    'p',
    `Depending on the Third Party Accounts you choose and subject to the privacy settings that you have set in such Third Party Accounts, personally identifiable information that you post to your Third Party Accounts may be available on and through your account on the Site. Please note that if a Third Party Account or associated service becomes unavailable or our access to such Third Party Account is terminated by the third party service provider, then Social Network Content may no longer be available on and through the Site.`,
  ],
  [
    'p',
    `You will have the ability to disable the connection between your account on the Site and your Third Party Accounts at any time.  Please note that your relationship with the third party service providers associated with your third party accounts is governed solely by your agreement(s) with such third party service providers. We make no effort to review any Social Network Content for any purpose, including but not limited to, for accuracy, legality or non-infringement, and we are not responsible for any Social Network Content.`,
  ],
  [
    'p',
    `You acknowledge and agree that we may access your email address book associated with a Third Party Account and your contacts list stored on your mobile device or tablet computer solely for purposes of identifying and informing you of those contacts who have also registered to use the Site. At your email request to info@moodflik.com or through your account settings (if applicable), we will deactivate the connection between the Site and your Third Party Account and attempt to delete any information stored on our servers that was obtained through such Third Party Account, except the username and profile picture that became associated with your account.`,
  ],

  ['h', `4. Content you provide to us`],
  [
    'p',
    `4.1 There may be opportunities for you to post content to the Site or send feedback to us (User Content). You understand and agree that your User Content may be viewed by other users on the Site, and that they may be able to see who has posted that User Content.`,
  ],
  [
    'p',
    `4.2 You further agree that we can use your User Content for any other purposes whatsoever in perpetuity without payment to you, and combine your User Content with other content for use within the Site and otherwise. We do not have to attribute your User Content to you. When you upload or post content to our site, you grant us the following rights to use that content:`,
  ],
  [
    'p',
    `4.3 In posting User Content, including reviews or making contact with other users of the Site you shall comply with our Acceptable Use Policy.`,
  ],
  [
    'p',
    `4.4 You warrant that any User Content does comply with our Acceptable Use Policy, and you will be liable to us and indemnify us for any breach of that warranty. This means you will be responsible for any loss or damage we suffer as a result of your breach of this warranty.`,
  ],
  [
    'p',
    `4.5 We have the right to remove any User Content you put on the Site if, in our opinion, such User Content does not comply with the Acceptable Use Policy.`,
  ],
  [
    'p',
    `4.6 We are not responsible and accept no liability for any User Content including any such content that contains incorrect information or is defamatory or loss of User Content. We accept no obligation to screen, edit or monitor any User Content but we reserve the right to remove, screen and/or edit any User Content without notice and at any time. User Content has not been verified or approved by us and the views expressed by other users on the Site do not represent our views or values.`,
  ],
  [
    'p',
    `4.7 If you wish to complain about User Content uploaded by other users please contact us at info@moodflik.com or use the take down or report button.`,
  ],

  ['h', `5. Our content`],
  [
    'p',
    `5.1 Unless otherwise indicated, the Site and Services including source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (Our Content) are owned or licensed to us, and are protected by copyright and trade mark laws.`,
  ],
  [
    'p',
    `5.2 Except as expressly provided in these Terms and Conditions, no part of the Site, Services or Our Content may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.`,
  ],
  [
    'p',
    `5.3 Provided that you are eligible to use the Site, you are granted a limited licence to access and use the Site and Our Content and to download or print a copy of any portion of the Content to which you have properly gained access solely for your personal, non-commercial use.`,
  ],
  [
    'p',
    `5.4 You shall not (a) try to gain unauthorised access to the Site or any networks, servers or computer systems connected to the Site; and/or (b) make for any purpose including error correction, any modifications, adaptions, additions or enhancements to the Site or Our Content, including the modification of the paper or digital copies you may have downloaded.`,
  ],
  [
    'p',
    `5.5 We shall (a) prepare the Site and Our Content with reasonable skill and care; and (b) use industry standard virus detection software to try to block the uploading of content to the Site that contains viruses.`,
  ],
  [
    'p',
    `5.6 The content on the Site is provided for general information only. It is not intended to amount to advice on which you should rely. You must obtain professional or specialist advice before taking, or refraining from taking, any action on the basis of the content on the Site.`,
  ],
  [
    'p',
    `5.7 Although we make reasonable efforts to update the information on our site, we make no representations, warranties or guarantees, whether express or implied, that Our Content on the Site is accurate, complete or up to date.`,
  ],

  ['h', `6. Link to third party content`],
  [
    'p',
    `6.1 The Site may contain links to websites or applications operated by third parties. We do not have any influence or control over any such third party websites or applications or the third party operator. We are not responsible for and do not endorse any third party websites or applications or their availability or content.`,
  ],
  [
    'p',
    `6.2 We accept no responsibility for adverts contained within the Site. If you agree to purchase goods and/or services from any third party who advertises in the Site, you do so at your own risk. The advertiser, and not us, is responsible for such goods and/or services and if you have any questions or complaints in relation to them, you should contact the advertiser.`,
  ],

  ['h', `7. Site Management`],
  [
    'p',
    `7.1 We reserve the right at our sole discretion, to (1) monitor the Site for breaches of these Terms and Conditions; (2) take appropriate legal action against anyone in breach of applicable laws or these Terms and Conditions; (3) refuse, restrict access to or availability of, or disable (to the extent technologically feasible) any of your Contributions; (4) remove from the Site or otherwise disable all files and content that are excessive in size or are in any way a burden to our systems; and (5) otherwise manage the Site in a manner designed to protect our rights and property and to facilitate the proper functioning of the Site and Services.`,
  ],
  ['p', `7.2 We do not guarantee that the Site will be secure or free from bugs or viruses.`],
  [
    'p',
    `7.3 You are responsible for configuring your information technology, computer programs and platform to access the Site and you should use your own virus protection software.`,
  ],

  ['h', `8. Modifications to and availability of the Site`],
  [
    'p',
    `8.1 We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. We also reserve the right to modify or discontinue all or part of the Services without notice at any time.`,
  ],
  [
    'p',
    `8.2 We cannot guarantee the Site and Services will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Site, resulting in interruptions, delays, or errors. You agree that we have no liability whatsoever for any loss, damage, or inconvenience caused by your inability to access or use the Site or Services during any downtime or discontinuance of the Site or Services. We are not obliged to maintain and support the Site or Services or to supply any corrections, updates, or releases.`,
  ],
  [
    'p',
    `8.3 There may be information on the Site that contains typographical errors, inaccuracies, or omissions that may relate to the Services, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information at any time, without prior notice.`,
  ],

  ['h', `9. Disclaimer/Limitation of Liability`],
  [
    'p',
    `9.1 The Site and Services are provided on an as-is and as-available basis. You agree that your use of the Site and/or Services will be at your sole risk except as expressly set out in these Terms and Conditions. All warranties, terms, conditions and undertakings, express or implied (including by statute, custom or usage, a course of dealing, or common law) in connection with the Site and Services and your use thereof including, without limitation, the implied warranties of satisfactory quality, fitness for a particular purpose and non-infringement are excluded to the fullest extent permitted by applicable law.`,
  ],
  [
    'p',
    `We make no warranties or representations about the accuracy or completeness of the Site’s content and are not liable for any (1) errors or omissions in content; (2) any unauthorized access to or use of our servers and/or any and all personal information and/or financial information stored on our server; (3) any interruption or cessation of transmission to or from the site or services; and/or (4) any bugs, viruses, trojan horses, or the like which may be transmitted to or through the site by any third party. We will not be responsible for any delay or failure to comply with our obligations under these Terms and Conditions if such delay or failure is caused by an event beyond our reasonable control.`,
  ],
  ['p', `9.2 Our responsibility for loss or damage suffered by you:`],
  ['h', `Whether you are a consumer or a business user:`],
  [
    'li',
    `We do not exclude or limit in any way our liability to you where it would be unlawful to do so. This includes liability for death or personal injury caused by our negligence or the negligence of our employees, agents or subcontractors and for fraud or fraudulent misrepresentation`,
  ],
  [
    'li',
    `If we fail to comply with these Terms and Conditions, we will be responsible for loss or damage you suffer that is a foreseeable result of our breach of these Terms and Conditions, but we would not be responsible for any loss or damage that were not foreseeable at the time you started using the Site/Services.`,
  ],
  [
    'p',
    `Not with standing anything to the contrary contained in the Disclaimer/Limitation of Liability section, our liability to you for any cause whatsoever and regardless of the form of the action, will at all times be limited to a total aggregate amount equal to the greater of (a) the sum of £1,500 or (b) the amount paid, if any, by you to us for the Services/Site during the six (6) month period prior to any cause of action arising.`,
  ],
  ['h', `If you are a business user:`],
  [
    'p',
    `We will not be liable to you for any loss or damage, whether in contract, tort (including negligence), breach of statutory duty, or otherwise, even if foreseeable, arising under or in connection with:`,
  ],
  ['li', `use of, or inability to use, our Site/Services; or`],
  ['li', `use of or reliance on any content displayed on our Site`],
  ['p', `In particular, we will not be liable for:`],
  ['li', `loss of profits, sales, business, or revenue;`],
  ['li', `business interruption;`],
  ['li', `loss of anticipated savings;`],
  ['li', `loss of business opportunity, goodwill or reputation; or`],
  ['li', `any indirect or consequential loss or damage.`],
  ['h', `If you are a consumer user:`],
  [
    'li',
    `Please note that we only provide our Site for domestic and private use. You agree not to use our Site for any commercial or business purposes, and we have no liability to you for any loss of profit, loss of business, business interruption, or loss of business opportunity.`,
  ],
  [
    'li',
    `If defective digital content that we have supplied, damages a device or digital content belonging to you and this is caused by our failure to use reasonable care and skill, we will either repair the damage or pay you compensation`,
  ],
  [
    'li',
    `You have legal rights in relation to goods that are faulty or not as described. Advice about your legal rights is available from your local Citizens' Advice Bureau or Trading Standards office. Nothing in these Terms and Conditions will affect these legal rights.`,
  ],

  ['h', `10. Term and Termination`],
  [
    'p',
    `10.1 These Terms and Conditions shall remain in full force and effect while you use the Site or Services or are otherwise a user of the Site, as applicable. You may terminate your use or participation at any time, for any reason, by following the instructions for terminating user accounts in your account settings, if available, or by contacting us at info@moodflik.com.`,
  ],
  [
    'p',
    `10.2 Without limiting any other provision of these Terms and Conditions, we reserve the right to, in our sole discretion and without notice or liability, deny access to and use of the Site and the Services (including blocking certain IP addresses), to any person for any reason including without limitation for breach of any representation, warranty or covenant contained in these Terms and Conditions or of any applicable law or regulation.`,
  ],
  [
    'p',
    `If we determine, in our sole discretion, that your use of the Site/Services is in breach of these Terms and Conditions or of any applicable law or regulation, we may terminate your use or participation in the Site and the Services or delete your profile and any content or information that you posted at any time, without warning, in our sole discretion.`,
  ],
  [
    'p',
    `10.3 If we terminate or suspend your account for any reason set out in this Section 9, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party, even if you may be acting on behalf of the third party. In addition to terminating or suspending your account, we reserve the right to take appropriate legal action, including without limitation pursuing civil, criminal, and injunctive redress.`,
  ],

  ['h', `11. Mobile Application`],
  [
    'p',
    `11.1 If you access the Services via a mobile application, then we grant you a revocable, non-exclusive, non-transferable, limited right to install and use the mobile application on wireless electronic devices owned or controlled by you, and to access and use the mobile application on such devices strictly in accordance with the terms and conditions of this license.`,
  ],
  ['p', `11.2 For business users only - You will not:`],
  [
    'p',
    `(a) reverse engineer, decompile or otherwise try to discover the source code of the software/application unless you have first written to us requesting interoperability information and we have failed to provide you with that information or if we have failed to offer to provide you with interoperability information on reasonable conditions;`,
  ],
  [
    'p',
    `(b) make any modification, adaptation, improvement, enhancement, translation or derivative work from the application;`,
  ],
  [
    'p',
    `(c) breach any applicable laws, rules or regulations in connection with your access or use of the application;`,
  ],
  [
    'p',
    `(d) remove, alter or obscure any proprietary notice (including any notice of copyright or trade mark) posted by us or the licensors of the application;`,
  ],
  [
    'p',
    `(e) use the application for Site for any revenue generating endeavour, commercial enterprise, or other purpose for which it is not designed or intended;`,
  ],
  [
    'p',
    `(f) make the application available over a network or other environment permitting access or use by multiple devices or users at the same time;`,
  ],
  [
    'p',
    `(g) use the application for creating a product, service or software that is, directly or indirectly, competitive with or in any way a substitute for the application;`,
  ],
  [
    'p',
    `(h) use the application to send automated queries to any website or to send any unsolicited commercial e-mail; or`,
  ],
  [
    'p',
    `(i) use any proprietary information or any of our interfaces or our other intellectual property in the design, development, manufacture, licensing or distribution of any applications, accessories or devices for use with the application.`,
  ],
  [
    'p',
    `11.3 The following terms apply when you use a mobile application obtained from either the Apple Store or Google Play (each an App Distributor) to access the Services:`,
  ],
  [
    'p',
    `(a) The licence granted to you for our mobile application is limited to a non-transferable licence to use the application on a device that utilizes the Apple iOS or Android operating system, as applicable, and in accordance with the usage rules set forth in the applicable App Distributor terms of service;`,
  ],
  [
    'p',
    `(b) We are responsible for providing any maintenance and support services with respect to the mobile application as specified in these Terms and Conditions or as otherwise required under applicable law. You acknowledge that each App Distributor has no obligation whatsoever to furnish any maintenance and support services with respect to the mobile application;`,
  ],
  [
    'p',
    `(c) In the event of any failure of the mobile application to conform to any applicable warranty, you may notify an App Distributor, and the App Distributor, in accordance with its terms and policies, may refund the purchase price, if any, paid for the mobile application, and to the maximum extent permitted by applicable law, an App Distributor will have no other warranty obligation whatsoever with respect to the mobile application;`,
  ],
  [
    'p',
    `(d) You represent and warrant that (i) you are not located in a country that is subject to a U.S. government embargo, or that has been designated by the U.S. government as a "terrorist supporting" country; and (ii) you are not listed on any U.S. government list of prohibited or restricted parties;`,
  ],
  [
    'p',
    `(e) You must comply with applicable third party terms of agreement when using the mobile application, e.g., if you have a VoIP application, then you must not be in breach of their wireless data service agreement when using the mobile application; and`,
  ],
  [
    'p',
    `(f) You acknowledge and agree that the App Distributors are third party beneficiaries of these Terms and Conditions, and that each App Distributor will have the right (and will be deemed to have accepted the right) to enforce these Terms and Conditions against you as a third party beneficiary thereof.`,
  ],

  ['h', `12. General`],
  [
    'p',
    `12.1 Visiting the Site, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email and on the Site, satisfy any legal requirement that such communication be in writing.`,
  ],
  [
    'p',
    `ou acknowledge that you have read this Agreement and agree to all its terms and conditions. By accessing and using the Website and Services you agree to be bound by this Agreement. If you do not agree to abide by the terms of this Agreement, you are not authorized to access or use the Website and Services.`,
  ],
  [
    'p',
    `You hereby agree to the use of electronic signatures, contracts, orders and other records and to electronic delivery of notices, policies and records of transactions initiated or completed by us or via the Site.  You hereby waive any rights or requirements under any statutes, regulations, rules, ordinances or other laws in any jurisdiction which require an original signature or delivery or retention of non-electronic records, or to payments or the granting of credits by other than electronic means.`,
  ],
  [
    'p',
    `12.2 These Terms and Conditions and any policies or operating rules posted by us on the Site or in respect to the Services constitute the entire agreement and understanding between you and us.`,
  ],
  [
    'p',
    `12.3 Our failure to exercise or enforce any right or provision of these Terms and Conditions shall not operate as a waiver of such right or provision.`,
  ],
  ['p', `12.4 We may assign any or all of our rights and obligations to others at any time.`],
  [
    'p',
    `12.5 We shall not be responsible or liable for any loss, damage, delay or failure to act caused by any cause beyond our reasonable control.`,
  ],
  [
    'p',
    `12.6 If any provision or part of a provision of these Terms and Conditions is unlawful, void or unenforceable, that provision or part of the provision is deemed severable from these Terms and Conditions and does not affect the validity and enforceability of any remaining provisions.`,
  ],
  [
    'p',
    `12.7 There is no joint venture, partnership, employment or agency relationship created between you and us as a result of these Terms and Conditions or use of the Site or Services.`,
  ],
  [
    'p',
    `12.8 For consumers only - Please note that these Terms and Conditions, their subject matter and their formation, are governed by English law. You and we both agree that the courts of England and Wales will have exclusive jurisdiction expect that if you are a resident of Northern Ireland you may also bring proceedings in Northern Ireland, and if you are resident of Scotland, you may also bring proceedings in Scotland. If you have any complaint or wish to raise a dispute under these Terms and Conditions or otherwise in relation to the Site please follow this link http://ec.europa.eu/odr .`,
  ],
  [
    'p',
    `12.9 For business users only   - If you are a business user, these Terms and Conditions, their subject matter and their formation (and any non-contractual disputes or claims) are governed by English Law. We both agree to the exclusive jurisdiction of the courts of England and Wales.`,
  ],
  [
    'p',
    `12.10 Except as stated under the Mobile Application section, a person who is not a party to these Terms and Conditions shall have no right under the Contracts (Rights of Third Parties) Act 1999 to enforce any term of these Terms and Conditions.`,
  ],
  [
    'p',
    `12.11 In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us by email at info@moodflik.com or by post to:`,
  ],
  ['p', `Moodflik`],
  ['p', `Church Lane`],
  ['p', `Manchester, Greater Manchester M9 4LA.`],
  ['p', `United Kingdom.`],
];

/** The copy supplied for this page ends part-way through "Retention of information". */
export const policy: ContentBlock[] = [
  ['h', `Privacy Policy`],
  [
    'p',
    `This privacy policy ("Policy") describes how the personally identifiable information ("Personal Information") you may provide on the moodflik.com website ("Website" or "Service") and any of its related products and services (collectively, "Services") is collected, protected and used. It also describes the choices available to you regarding our use of your Personal Information and how you can access and update this information. This Policy is a legally binding agreement between you ("User", "you" or "your") and this Website operator ("Operator", "we", "us" or "our"). By accessing and using the Website and Services, you acknowledge that you have read, understood, and agree to be bound by the terms of this Agreement. This Policy does not apply to the practices of companies that we do not own or control, or to individuals that we do not employ or manage.`,
  ],
  ['h', `Automatic collection of information`],
  [
    'p',
    `When you open the Website, our servers automatically record information that your browser sends. This data may include information such as your device's IP address, browser type and version, operating system type and version, language preferences or the webpage you were visiting before you came to the Website and Services, pages of the Website and Services that you visit, the time spent on those pages, information you search for on the Website, access times and dates, and other statistics.`,
  ],
  [
    'p',
    `Information collected automatically is used only to identify potential cases of abuse and establish statistical information regarding the usage and traffic of the Website and Services. This statistical information is not otherwise aggregated in such a way that would identify any particular user of the system.`,
  ],
  ['p', `Collection of personal information`],
  [
    'p',
    `You can access and use the Website and Services without telling us who you are or revealing any information by which someone could identify you as a specific, identifiable individual. If, however, you wish to use some of the features on the Website, you may be asked to provide certain Personal Information (for example, your name and e-mail address). We receive and store any information you knowingly provide to us when you create an account, publish content, or fill any online forms on the Website. When required, this information may include the following:`,
  ],
  [
    'p',
    `Personal details such as name, country of residence, etc. Contact information such as email address, address, etc. Account details such as user name, unique user ID, password, etc. Information about other individuals such as your family members, friends, etc. Any other materials you willingly submit to us such as articles, images, feedback, etc.`,
  ],
  [
    'p',
    `Some of the information we collect is directly from you via the Website and Services. However, we may also collect Personal Information about you from other sources such as public databases and our joint marketing partners. You can choose not to provide us with your Personal Information, but then you may not be able to take advantage of some of the features on the Website. Users who are uncertain about what information is mandatory are welcome to contact us.`,
  ],
  ['h', `Use and processing of collected information`],
  [
    'p',
    `In order to make the Website and Services available to you, or to meet a legal obligation, we need to collect and use certain Personal Information. If you do not provide the information that we request, we may not be able to provide you with the requested products or services. Any of the information we collect from you may be used for the following purposes:`,
  ],
  [
    'p',
    `Create and manage user accounts. Send administrative information Respond to inquiries and offer support Request user feedback Improve user experience Enforce terms and conditions and policies Protect from abuse and malicious users Respond to legal requests and prevent harm Run and operate the Website and Services`,
  ],
  [
    'p',
    `Processing your Personal Information depends on how you interact with the Website and Services, where you are located in the world and if one of the following applies: (i) you have given your consent for one or more specific purposes; this, however, does not apply, whenever the processing of Personal Information is subject to California Consumer Privacy Act or European data protection law; (ii) provision of information is necessary for the performance of an agreement with you and/or for any pre-contractual obligations thereof; (iii) processing is necessary for compliance with a legal obligation to which you are subject; (iv) processing is related to a task that is carried out in the public interest or in the exercise of official authority vested in us; (v) processing is necessary for the purposes of the legitimate interests pursued by us or by a third party.`,
  ],
  [
    'p',
    `Note that under some legislations we may be allowed to process information until you object to such processing (by opting out), without having to rely on consent or any other of the following legal bases below. In any case, we will be happy to clarify the specific legal basis that applies to the processing, and in particular whether the provision of Personal Information is a statutory or contractual requirement, or a requirement necessary to enter into a contract.`,
  ],
  ['p', `Managing information`],
  [
    'p',
    `You are able to delete certain Personal Information we have about you. The Personal Information you can delete may change as the Website and Services change. When you delete Personal Information, however, we may maintain a copy of the unrevised Personal Information in our records for the duration necessary to comply with our obligations to our affiliates and partners, and for the purposes described below. If you would like to delete your Personal Information or permanently delete your account, you can do so on the settings page of your account on the Website.`,
  ],
  ['h', `Disclosure of information`],
  [
    'p',
    `Depending on the requested Services or as necessary to complete any transaction or provide any service you have requested, we may share your information with your consent with our trusted third parties that work with us, any other affiliates and subsidiaries we rely upon to assist in the operation of the Website and Services available to you. We do not share Personal Information with unaffiliated third parties. These service providers are not authorized to use or disclose your information except as necessary to perform services on our behalf or comply with legal requirements. We may share your Personal Information for these purposes only with third parties whose privacy policies are consistent with ours or who agree to abide by our policies with respect to Personal Information. These third parties are given Personal Information they need only in order to perform their designated functions, and we do not authorize them to use or disclose Personal Information for their own marketing or other purposes.`,
  ],
  [
    'p',
    `We will disclose any Personal Information we collect, use or receive if required or permitted by law, such as to comply with a subpoena, or similar legal process, and when we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a government request.`,
  ],
  ['h', `Retention of information`],
  [
    'p',
    `We will retain and use your Personal Information for the period necessary to comply with our legal obligations, resolve disputes, and enforce our agreements unless a longer retention`,
  ],
];

export const csae: ContentBlock[] = [
  ['h', `Introduction`],
  [
    'p',
    `At Moodflik, we are committed to creating a safe and respectful environment for all users. We have a zero-tolerance stance towards any content or behavior that involves Child Sexual Abuse Material (CSAM) or exploits minors in any form. This policy outlines our standards and the measures we implement to prevent, detect, and address such violations.`,
  ],

  ['h', `Prohibited Content and Conduct`],
  ['p', `Moodflik strictly prohibits the following:`],
  [
    'li',
    `Child Sexual Abuse Material (CSAM): Any content that depicts or promotes the sexual exploitation or abuse of minors.`,
  ],
  [
    'li',
    `Sexualization of Minors: Content that portrays minors in a sexual manner, including suggestive imagery or descriptions.`,
  ],
  [
    'li',
    `Predatory Behavior: Actions that involve grooming, solicitation, or any form of inappropriate communication with minors.`,
  ],
  [
    'li',
    `Endangerment of Minors: Any activity that puts minors at risk, including sharing personal information without consent.`,
  ],

  ['h', `Reporting Mechanism`],
  [
    'p',
    `Users are encouraged to report any content or behavior that violates this policy through our in-app "Report" feature:`,
  ],
  ['li', `Accessing the Report Feature: Located in the menu of each post.`],
  [
    'li',
    `Submission Process: Upon reporting, the content is flagged and sent to our dedicated team at info@moodflik.com for thorough review.`,
  ],
  [
    'li',
    `Anonymity and Confidentiality: All reports are handled with strict confidentiality to protect the privacy of the reporting individual.`,
  ],

  ['h', `Enforcement Actions`],
  [
    'p',
    `Upon identifying content or behavior that violates our CSAE policy, Moodflik will take immediate action, which may include:`,
  ],
  ['li', `Content Removal: Immediate deletion of offending material from the platform.`],
  [
    'li',
    `Account Sanctions: Issuance of warnings, temporary suspensions, or permanent bans, depending on the severity of the violation.`,
  ],
  [
    'li',
    `Legal Reporting: In cases involving CSAM, Moodflik will report the content and the user to relevant law enforcement agencies and organizations dedicated to child protection.`,
  ],

  ['h', `Compliance with International Child Safety Laws`],
  [
    'p',
    `Moodflik is dedicated to adhering to child safety laws and regulations globally. Our compliance measures include:`,
  ],
  [
    'li',
    `Age Restrictions: Users must be at least 13 years old to create an account. Age verification mechanisms are in place to enforce this requirement.`,
  ],
  [
    'li',
    `Parental Controls: While Moodflik is not directed at children under 13, we support parental control tools and encourage parents to monitor their children's online activities.`,
  ],
  [
    'li',
    `Regular Policy Reviews: Our policies are periodically reviewed and updated to align with evolving international standards and best practices in child protection.`,
  ],

  ['h', `Collaboration with Authorities and Organizations`],
  [
    'p',
    `Moodflik collaborates with child protection organizations and law enforcement agencies to combat online child exploitation. We are committed to:`,
  ],
  ['li', `Reporting Obligations: Promptly reporting detected CSAM to appropriate authorities.`],
  [
    'li',
    `Information Sharing: Assisting in investigations by providing necessary information, in compliance with legal requirements.`,
  ],

  ['h', `User Education and Awareness`],
  ['p', `We believe in empowering our users with knowledge to foster a safe online community:`],
  [
    'li',
    `Safety Guidelines: Providing resources and guidelines on recognizing and avoiding harmful content and interactions.`,
  ],
  [
    'li',
    `Community Engagement: Encouraging discussions and initiatives that promote online safety and the well-being of minors.`,
  ],

  ['h', `Point of Contact for Child Safety Concerns`],
  [
    'p',
    `For any concerns or inquiries related to child safety on Moodflik, please contact: Mr. John Awoyomi`,
  ],
  ['p', `Email: info@moodflik.com`],
  [
    'p',
    `Moodflik is unwavering in its commitment to protecting minors and preventing the dissemination of exploitative content. Through vigilant enforcement of this policy and collaboration with our community and authorities, we strive to maintain a platform that is safe and respectful for all users.`,
  ],
];

/** Block User / Mute & Report pages. */
export const blockCopy = {
  title: `Because sometimes your mood is "Nah."`,
  intro: [
    `We get it — even on a platform built for emotional connection, not every vibe matches yours. Whether someone's posts feel like a dark cloud, their comments are just too much, or you simply need your space — blocking is your friendly boundary-setting superpower.`,
    `Here's how it works, Moodflikker:`,
    `When you block someone:`,
  ],
  bullets: [
    `They won't be able to see your posts, likes, Why's, or mood history. They can't comment on your stuff, tag you, or DM you.`,
    `You also won't see their posts, comments, or tags in your feed anymore.`,
    `No drama. No notifications. No one gets "alerted" when you block them — it's just between you and your inner peace.`,
  ],
  options: `Options`,
  who: `Who do you want to block?`,
  placeholder: `Type a username…`,
  recent: `Recently interacted:`,
  recentHelp: `When you search or engage with people, they'll appear here so you can set boundaries fast.`,
  changeMindTitle: `What happens if you change your mind?`,
  changeMind: `We love a good mood swing — so if someday you feel like unblocking, just come back here. You'll find all your blocked users neatly listed, ready to forgive (or not).`,
  blockListTitle: `Your Block List`,
  blockListNote: `(You can unblock anytime — we won't judge.)`,
  blockEmptyTitle: `Your Block List is clean — just like your aura.`,
  blockEmpty: [
    `You haven't blocked anyone yet. That's… kinda inspiring.`,
    `But if you ever need to set a boundary or take a breather from someone's energy, this is where they'll show up.`,
    `Until then — keep flikking those moods and spreading those vibes.`,
  ],
  muteListTitle: `Your Muted List`,
  muteListNote: `(Shhh... they don't know.)`,
  muteEmptyTitle: `Your Muted List is quiet.`,
  muteEmpty: `You haven’t muted anyone yet. Sometimes you just need to turn down the volume without cutting the cord. Muted users go here.`,
  helpTitle: `Need help?`,
  help: `If someone's behaviour goes beyond annoying and starts to feel unsafe or abusive, please also report them. Our Trust & Safety team is here for you.`,
  closing: `Go on. Set that boundary. Protect your vibe. You deserve it.`,
};

export const communityGuidelines: ContentBlock[] = [
  [
    'p',
    `Welcome to the Moodflik community! This is a safe space to express, discuss and share your interests (in the form of People, Places and Things you love) and dislikes. However, please note that though we appreciate that we all have varying and opposite views on various matters, we specifically DO NOT welcome any posts that incite, encourage or explicitly portray Hate ; hence the reason why we have specifically adopted the word Dislike rather than Hate. We will therefore kindly ask that all users adhere to our community guidelines as stipulated here.`,
  ],
  [
    'p',
    `We want everyone to be part of our community and have their voice heard. We encourage your feedback and aim to respond to your comments as soon as possible. While we do moderate this community, we welcome open discussion.`,
  ],
  [
    'p',
    `To help everyone enjoy our community, we ask that when you post, you keep in mind the following:`,
  ],
  [
    'li',
    `We don’t allow defamatory, indecent, offensive, profane, discriminatory, misleading, unlawful or threatening comments.`,
  ],
  ['li', `Personal attacks, name-calling, trolling and abuse will not be tolerated.`],
  [
    'li',
    `Spamming, posting promotional material or posting links to third party websites is not permitted.`,
  ],
  [
    'li',
    `We reserve the right to delete comments at our discretion and block any repeat offenders. We will remove content that is fraudulent, deceptive or misleading.`,
  ],
  ['li', `Coordinated group attacks will not be tolerated.`],
  [
    'li',
    `Our community is a public place. Don’t post personal information that you would not be comfortable sharing with a stranger. We recommend that you don’t post any information that may identify you or anyone else, such as your address, email address or phone number.`,
  ],
  [
    'li',
    `Moodflik Employees participating in the discussion in our community are reminded of the staff social media guidelines.`,
  ],
  ['li', `Here is the reference to Moodflik's Child Sexual Abuse and Exploitation (CSAE) Policy`],
  [
    'p',
    `If you have questions about a product or service of ours, please get in touch via our mobile or web applicattion at www.moodflik.com`,
  ],
  [
    'p',
    `If you’d like to chat with the Moodflik team, please get in touch with us at: info@moodflik.com`,
  ],
];

export const cookies: ContentBlock[] = [
  ['h', `Cookie Policy`],
  [
    'p',
    `This cookie policy ("Policy") describes what cookies are and how and they're being used by the moodflik.com website ("Website" or "Service") and any of its related products and services (collectively, "Services"). This Policy is a legally binding agreement between you ("User", "you" or "your") and this Website operator ("Operator", "we", "us" or "our"). You should read this Policy so you can understand the types of cookies we use, the information we collect using cookies and how that information is used. It also describes the choices available to you regarding accepting or declining the use of cookies. For further information on how we use, store and keep your personal data secure, see our Privacy Policy.`,
  ],
  ['h', `What are Cookies ?`],
  [
    'p',
    `Cookies are small pieces of data stored in text files that are saved on your computer or other devices when websites are loaded in a browser. They are widely used to remember you and your preferences, either for a single visit (through a "session cookie") or for multiple repeat visits (using a "persistent cookie").`,
  ],
  [
    'p',
    `Session cookies are temporary cookies that are used during the course of your visit to the Website, and they expire when you close the web browser.`,
  ],
  [
    'p',
    `Persistent cookies are used to remember your preferences within our Website and remain on your desktop or mobile device even after you close your browser or restart your computer. They ensure a consistent and efficient experience for you while visiting the Website and Services.`,
  ],
  [
    'p',
    `Cookies may be set by the Website ("first-party cookies"), or by third parties, such as those who serve content or provide advertising or analytics services on the Website ("third party cookies"). These third parties can recognize you when you visit our website and also when you visit certain other websites.`,
  ],
  ['h', `What type of cookies do we use?`],
  ['q', `Necessary cookies[`],
  [
    'p',
    `Necessary cookies allow us to offer you the best possible experience when accessing and navigating through our Website and using its features. For example, these cookies let us recognize that you have created an account and have logged into that account to access the content.`,
  ],
  ['q', `Functionality cookies`],
  [
    'p',
    `Functionality cookies let us operate the Website and Services in accordance with the choices you make. For example, we will recognize your username and remember how you customized the Website and Services during future visits.`,
  ],
  ['h', `What are your cookie options?`],
  [
    'p',
    `If you don't like the idea of cookies or certain types of cookies, you can change your browser's settings to delete cookies that have already been set and to not accept new cookies. To learn more about how to do this or to learn more about cookies, visit internetcookies.org`,
  ],
  ['h', `Changes and amendments`],
  [
    'p',
    `We reserve the right to modify this Policy or its terms relating to the Website and Services at any time, effective upon posting of an updated version of this Policy on the Website. When we do, we will send you an email to notify you. Continued use of the Website and Services after any such changes shall constitute your consent to such changes.`,
  ],
  ['h', `Acceptance of this policy`],
  [
    'p',
    `You acknowledge that you have read this Policy and agree to all its terms and conditions. By accessing and using the Website and Services you agree to be bound by this Policy. If you do not agree to abide by the terms of this Policy, you are not authorized to access or use the Website and Services.`,
  ],
  ['h', `Contacting us`],
  [
    'p',
    `If you would like to contact us to understand more about this Policy or wish to contact us concerning any matter relating to our use of cookies, you may send an email to info@moodflik.com`,
  ],
];
