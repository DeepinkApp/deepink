---
title: Security
description: Analysis and insights about a note-taking app's security threats.
---

![Advanced encryption screen with options to configure encryption algorithm and key derivation function](./encryption-options.png)

The Deepink mission is to make note-taking simple, quick, and safe.

Deepink’s ergonomics are explained in the [introduction](/introduction). Now let’s explore the security aspect.

## Why do I need to encrypt my data?

We live in the age of computers. Computers contain a lot of insights about their owners.

There are people who know this and actively exploit that fact for corporate spying, blackmail, hacking, and phishing based on personal profiling, targeted marketing spam, etc.

Your personal notes [may be copied](https://www.theguardian.com/world/2014/jul/18/-sp-edward-snowden-nsa-whistleblower-interview-transcript) along with your entire disk by a random police officer at an airport or in the course of an insignificant investigation. Then your personal life will be analyzed, and any insights found may be used against you.

Your personal photos and other data may be stolen by some random software you’ve installed. Did you know that “anti-virus” software can send any of your files to remote servers “with the intention to detect threats”?

As Edward Snowden said in a 2014 [interview with The Guardian](https://www.theguardian.com/world/2014/jul/18/-sp-edward-snowden-nsa-whistleblower-interview-transcript):
> Many of the people searching through the haystacks were young, enlisted guys and … 18 to 22 years old. They’ve suddenly been thrust into a position of extraordinary responsibility where they now have access to all your private records. In the course of their daily work they stumble across something that is completely unrelated to their work, for example an intimate nude photo of someone in a sexually compromising situation but they’re extremely attractive. So what do they do? They turn around in their chair and they show a co-worker. And their co-worker says: “Oh, hey, that’s great. Send that to Bill down the way.” And then Bill sends it to George, George sends it to Tom and sooner or later this person’s whole life has been seen by all of these other people. Anything goes, more or less. You’re in a vaulted space. Everybody has sort of similar clearances, everybody knows everybody. It’s a small world.

Most note-taking apps just ignore this reality, so users of such apps are basically in the same situation as a child with a physical diary where they write down their private thoughts — feelings, fears, loves, disappointments, disillusionments, and other deeply personal insights. 

Those insights will remain “personal” only if their parents are fair and don’t read the diary in secret. In fact, nothing stops them from reading it, not even a cute lock.

## Why Deepink?

Deepink admits this reality and protects its users by default.

It encrypts your vault and doesn’t make you think about the details.

There are many apps that claim they protect and “encrypt” your data. Our research says they are lying and treat their users in the most disgusting ways.

For example, some apps encrypt only note text, but not attachments, so your photos will be disclosed.

Others mean that they encrypt the sync data sent to their server. That’s a good intention, but the data on your device remains unprotected and available for analysis.

At Deepink, we researched over 60 note-taking apps, and none of them are good enough to trust with your private notes.

Deepink is [open source](https://github.com/DeepinkApp/deepink), secure by design, and still built for normal people—not only geeks.

## The credibility

In terms of security, any app that is not developed as open source is considered a security threat for many reasons.

The most important ones:
- The app may execute any code, and users will never know what exactly it does. It may spy on you.
- Even if app developers have no intention to spy on you, malware code [may be injected](https://vitonsky.net/blog/2023/09/01/malware-in-browser-extensions/) via a supply chain attack, or because programmers didn’t have enough expertise and screwed up, or got bribed or deceived. End users will have no chance to detect that without source code analysis.
- The community cannot analyze the code and audit the security. As a result, some products try to buy users by publishing “independent audits” that are actually run on a “pay to approve” basis.
- The community and end users cannot even track how known security problems have been fixed. This may lead to situations where a known vulnerability is fixed and no longer reproduced with the known steps, but can still be reproduced with slightly changed steps.

These aren’t all the reasons, but they are the most important ones.

This is why any proprietary note-taking app cannot be considered credible or reliable.

And that’s why Deepink is [open source](https://github.com/DeepinkApp/deepink).

Everybody is welcome to audit the code, rebuild it, contribute a patch or even a new feature, and star the repo 😉

## The ergonomics

Deepink is built for everyone. As a user, you just set a password and take notes quickly.

The default settings are good enough to ensure your privacy and make note-taking simple. If you want, you can tune the settings a bit, but you can’t silently break the security.

You don’t have to buy a separate laptop and set up full-disk encryption just to encrypt your notes and make it difficult for other software on your device to steal your personal data.

Just [install Deepink](/download).