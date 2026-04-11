export const DASHBOARD_STATS = {
  activeCases: 12,
  followUps: 3,
  formsPending: 2,
}

export const RECENT_CASES = [
  {
    id: 1,
    clientName: 'Maria Santos',
    lastContact: '2026-03-25',
    status: 'Active',
    riskLevel: 'high',
    summary: 'Housing instability, food insecurity',
    transcript: `Caseworker: Good morning, Maria. How have you been since our last session?

Client: Honestly, not great. I've been really stressed about the rent situation. My landlord sent another notice and I don't know what to do. I've been losing sleep over it.

Caseworker: I'm sorry to hear that. Can you tell me more about what happened with the rent?

Client: So I lost my job at the restaurant about six weeks ago when they cut staff. I've been applying everywhere but nothing has come through yet. I got approved for unemployment but it only covers about half of what I was making. My rent is $1,450 and I'm short about $600 this month.

Caseworker: That sounds very stressful. How are you and the kids managing day to day?

Client: The kids are okay, I think. Sofia — she's 8 — she's been asking why we don't have the same food anymore. I've been skipping meals so they can eat. We used to go to the food bank on Tuesdays but I can't get there anymore because of the bus schedule change. And Sofia's asthma medication needs a refill — it's $45 and I just can't afford it right now.

Caseworker: I want to make sure I understand everything. You're dealing with potential eviction, food insecurity, inability to afford medication, and job loss all at once?

Client: Yes. And I heard about CalFresh but I don't even know how to apply. I feel like I'm failing as a mom. I was up until 3am last night just worrying.`,
  },
  {
    id: 2,
    clientName: 'James Thompson',
    lastContact: '2026-03-24',
    status: 'Follow-up',
    riskLevel: 'medium',
    summary: 'Employment search, financial counseling',
    transcript: `Caseworker: Hi James, thanks for coming in today. How's the job search going?

Client: Slow, honestly. I've been applying to warehouse and delivery jobs like we talked about, but I haven't heard back from anyone yet. It's been three weeks now.

Caseworker: That can be discouraging. Have you been using the resume we updated last time?

Client: Yeah, I've been sending it out. But I think the gap on my resume is hurting me. Two years without work — employers see that and move on. I did have one phone screen with a logistics company but they wanted someone with forklift certification.

Caseworker: That's actually good information. The WorkSource center on 5th Street offers free forklift certification — it's a two-week course. Would you be interested?

Client: Definitely, if it's free. My savings are running out. I've got maybe two months of rent left and my car insurance is due next month. I've been cutting back on everything — cancelled my phone plan, been eating rice and beans mostly.

Caseworker: Let's also talk about some interim support. Have you looked into any financial assistance programs?

Client: No, I didn't think I'd qualify for anything since I don't have kids. But honestly I could use help with utilities too — my electric bill is past due.`,
  },
  {
    id: 3,
    clientName: 'Aisha Johnson',
    lastContact: '2026-03-22',
    status: 'Active',
    riskLevel: 'low',
    summary: 'Childcare assistance, school enrollment',
    transcript: `Caseworker: Good afternoon, Aisha. How are things settling in since the move?

Client: Getting better, slowly. The kids are adjusting. Jaylen started at his new school last week and seems to like it so far. But I still haven't been able to enroll Amara in preschool — every place near us has a waitlist.

Caseworker: How old is Amara now?

Client: She just turned 4. I really need her in a program because I can't go back to work until she's in some kind of childcare. My mom was helping but she went back to Atlanta last month.

Caseworker: I understand. There are a few subsidized childcare programs in your area. The Head Start center on Oak Avenue sometimes has openings mid-year. Would you like me to look into that?

Client: Please. And I also wanted to ask — Jaylen's teacher sent home a note saying he might need extra help with reading. He was in a tutoring program at his old school but I don't know what's available here.

Caseworker: We can definitely connect you with the school counselor to set up an assessment. How are you doing personally with all the changes?

Client: I'm managing. It's a lot — new city, no family nearby, trying to figure everything out. But we're safe and that's what matters. I just need to get the childcare sorted so I can start working again.`,
  },
  {
    id: 4,
    clientName: 'Robert Chen',
    lastContact: '2026-03-20',
    status: 'Active',
    riskLevel: 'high',
    summary: 'Substance abuse recovery, mental health support',
    transcript: `Caseworker: Robert, thank you for coming in. How have things been since we last met?

Client: It's been rough. I'm 90 days clean now, which is good, but everything else feels like it's falling apart. My wife asked me to move out last week. I'm staying at my brother's place but that's temporary.

Caseworker: Congratulations on 90 days — that's a real milestone. I'm sorry to hear about the housing situation. How are you feeling about everything?

Client: Honestly, it's hard not to use. Every day is a battle. I'm going to my NA meetings — three times a week like we planned — but the stress of not having a stable place to live makes everything harder. I almost didn't come today.

Caseworker: I'm glad you did come. Are you still connected with your sponsor?

Client: Yeah, Mike's been great. He checks in on me every day. And the outpatient program at Mercy is helping with the counseling piece. But I need to find my own place soon — my brother has a small apartment and I'm sleeping on the couch. It's not sustainable.

Caseworker: Let's look at some transitional housing options. There are programs specifically for people in recovery that provide stable housing with built-in support. How does that sound?

Client: I'd be open to that. I also need to figure out the job situation. I was a line cook before everything happened, but most restaurant jobs are nights and that's when I'm most vulnerable. I need something with a day schedule.`,
  },
  {
    id: 5,
    clientName: 'Sofia Ramirez',
    lastContact: '2026-03-18',
    status: 'Closed',
    riskLevel: 'none',
    summary: 'Successfully placed in employment program',
    transcript: `Caseworker: Sofia, great to see you! This should be our last scheduled check-in. How's the new job going?

Client: It's going really well! I finished the training last week and I'm officially a full-time medical records technician now. The pay is good and they have benefits starting next month.

Caseworker: That's wonderful news. How has the transition been from the training program?

Client: Smooth, actually. The coding bootcamp you connected me with really prepared me well. My supervisor said I picked things up faster than most new hires. And I love that it's a day shift — I can pick up my son from school now.

Caseworker: And how's the housing situation? Last time we talked you were looking at apartments closer to work.

Client: We moved in two weeks ago! It's a two-bedroom, close to the bus line, and the rent is manageable with my new salary. Marcus has his own room for the first time. He's so happy.

Caseworker: I'm really proud of the progress you've made, Sofia. Six months ago you were in a very different place.

Client: I know. I couldn't have done it without the support. The job training, the housing voucher, the childcare assistance — it all came together. I actually feel stable for the first time in years. I want to make sure other people know these programs exist.`,
  },
]
