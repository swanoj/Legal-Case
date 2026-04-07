import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

export const seedDatabase = async (db: any, userUid: string) => {
  if (!userUid) return;

  const documents = [
    {
      name: "Greg Radford Witness Statement",
      type: "Evidence",
      description: "Statement supporting IVO extension. Details FaceTime calls on 25 Dec 2024 and 14 Jul 2025, and Oliver's lack of engagement with Oscar.",
      summary: "Greg Radford states Oliver breached IVO by contacting Jess directly on 13 Jul 2025. During FaceTime calls, Oliver talked about himself and showed little interest in Oscar.",
      keyDetails: "Breach of IVO on 13/07/2025. Poor engagement during supervised FaceTime.",
      aiProcessed: true
    },
    {
      name: "Certified Extract Q10496489",
      type: "Court Order",
      description: "Court register extract showing history of IVO proceedings from Mar 2024 to Dec 2025.",
      summary: "Shows Interim Orders made in Mar, May, Jul 2024. Final IVO made 21 Oct 2024. Extension application filed, Interim Order granted 15 Oct 2025. Contested hearing set for 20 Apr 2026.",
      keyDetails: "Contested Hearing scheduled for 20 April 2026.",
      aiProcessed: true
    },
    {
      name: "FGD Letter - Interim Parenting",
      type: "Correspondence",
      description: "Letter from Farrar Gesini Dunn proposing interim parenting arrangements (20 Sep 2024).",
      summary: "Oliver's lawyers propose supervised time by Kerri and Victor Vollembroich, bi-monthly urine screens, and note Oliver completed the U-Turn Men's Behaviour Change program.",
      keyDetails: "Proposes supervised visits and drug testing. Notes completion of U-Turn program.",
      aiProcessed: true
    },
    {
      name: "FGD Letter - IVO Outcome",
      type: "Correspondence",
      description: "Letter from FGD advising Oliver on the 21 Oct 2024 IVO hearing outcome.",
      summary: "Advises that consenting to a Final IVO without admissions for 12 months avoids findings of fact and saves legal fees for family law matters.",
      keyDetails: "Final IVO agreed without admissions. Expires 21 Oct 2025.",
      aiProcessed: true
    },
    {
      name: "Further and Better Particulars (7 Oct 2024)",
      type: "Evidence",
      description: "Jessica Radford's initial F&BP detailing allegations of family violence and drug use.",
      summary: "Alleges physical/verbal abuse, smashed phone on 11 Jan 2024, cocaine use, and coercive control. Includes photos of broken phone and baby monitor logs.",
      keyDetails: "Smashed phone incident 11 Jan 2024. Allegations of cocaine use.",
      aiProcessed: true
    },
    {
      name: "Further and Better Particulars (25 Nov 2025)",
      type: "Evidence",
      description: "Jessica Radford's F&BP for IVO extension.",
      summary: "Seeks IVO extension until Oscar is 18 (2040). Cites Oliver's $26k child support arrears, messages from Oliver's ex-girlfriend Nicola Mors warning he is unsafe/using drugs, and Nicola's own 2-year IVO against Oliver.",
      keyDetails: "Nicola Mors obtained 2-year IVO against Oliver on 12 Nov 2025. $26,983 in child support arrears.",
      aiProcessed: true
    },
    {
      name: "Letter from Dr Rich Bradlow",
      type: "Medical",
      description: "Psychiatrist letter dated 3 Nov 2025 from The Victoria Clinic.",
      summary: "Confirms Oliver is an inpatient in the Dual Diagnosis program since 20 Oct 2025 for drug, alcohol, and mental health issues. Notes drug-induced psychosis during last relapse.",
      keyDetails: "Admitted 20/10/2025. History of drug-induced psychosis.",
      aiProcessed: true
    },
    {
      name: "Letter from Dr Anna Cunningham",
      type: "Medical",
      description: "Addictions Psychiatrist letter dated 6 Nov 2025.",
      summary: "Confirms Oliver's inpatient status at Victoria Clinic Dual Diagnosis program. States drug and breath tests have been clear and he is engaging well.",
      keyDetails: "Clear drug/breath tests during admission.",
      aiProcessed: true
    },
    {
      name: "Letter from Malvern Private Hospital",
      type: "Medical",
      description: "Admission confirmation dated 3 Oct 2025.",
      summary: "Confirms Oliver was admitted to intensive inpatient addiction program from 17 Sep 2025 to 15 Oct 2025.",
      keyDetails: "Inpatient rehab 17/09/2025 - 15/10/2025.",
      aiProcessed: true
    },
    {
      name: "Relationship Brief by Oliver",
      type: "Client Notes",
      description: "Oliver's summary of the relationship and separation.",
      summary: "Details relationship timeline (Dec 2020 - Jan 2024). Oscar born via cryptic pregnancy. Acknowledges recreational drug use by both parties. Argument on 11 Jan 2024 led to separation.",
      keyDetails: "Separation date: 11 Jan 2024. Last unsupervised care of Oscar: 5 Mar 2024.",
      aiProcessed: true
    },
    {
      name: "Text Messages - Greg & Oliver",
      type: "Evidence",
      description: "Export of text messages between Greg Radford and Oliver.",
      summary: "Shows Oliver's attempts to arrange time with Oscar in early 2024, disputes over schedules, and the FaceTime calls in Dec 2024 and July 2025.",
      keyDetails: "Shows communication was restricted to Greg. Oliver requested FaceTime on 13 Jul 2025.",
      aiProcessed: true
    }
  ];

  const timelineEvents = [
    { date: "2022-10-17", title: "Oscar Swan Born", description: "Oscar born via cryptic pregnancy (12 mins notice).", category: "milestone" },
    { date: "2024-01-11", title: "Final Separation", description: "Argument occurred. Jessica alleges Oliver smashed her phone. Jessica and Oscar left the home.", category: "incident" },
    { date: "2024-03-05", title: "Last Unsupervised Care", description: "Last day Oscar was in Oliver's care unsupervised.", category: "custody" },
    { date: "2024-03-06", title: "Police File IVO", description: "Victoria Police filed application for IVO on behalf of Jessica.", category: "court" },
    { date: "2024-03-19", title: "Interim IVO Made", description: "First Interim IVO made against Oliver.", category: "court" },
    { date: "2024-07-18", title: "Supervised Time Ordered", description: "Magistrate ordered supervised time and urinalysis testing.", category: "court" },
    { date: "2024-09-20", title: "FGD Proposes Arrangements", description: "Farrar Gesini Dunn sent letter proposing supervised time by Vollembroichs and bi-monthly urine screens.", category: "document" },
    { date: "2024-10-07", title: "Jessica Files F&BP", description: "Jessica filed Further and Better Particulars alleging family violence, coercive control, and drug abuse.", category: "document" },
    { date: "2024-10-21", title: "Final IVO Made", description: "Final IVO made for 12 months by consent without admissions.", category: "court" },
    { date: "2024-12-25", title: "Christmas FaceTime", description: "Oliver had a short FaceTime call with Oscar, but mostly spoke to Greg.", category: "custody" },
    { date: "2025-06-30", title: "Warning from Ex-Girlfriend", description: "Nicola Mors (Oliver's ex) messaged Jessica warning her that Oliver is unsafe and using drugs.", category: "incident" },
    { date: "2025-07-13", title: "IVO Breach", description: "Oliver breached Final IVO by contacting Jessica directly to ask for FaceTime.", category: "incident" },
    { date: "2025-07-14", title: "July FaceTime", description: "FaceTime call between Oliver and Oscar facilitated by Greg Radford.", category: "custody" },
    { date: "2025-09-17", title: "Admitted to Malvern Private", description: "Oliver admitted to Malvern Private Hospital for intensive inpatient addiction treatment (until 15 Oct).", category: "medical" },
    { date: "2025-10-15", title: "Interim IVO Extension", description: "Interim IVO granted extending the Final IVO pending hearing.", category: "court" },
    { date: "2025-10-20", title: "Admitted to Victoria Clinic", description: "Oliver admitted to The Victoria Clinic Dual Diagnosis program for drugs, alcohol, and mental health.", category: "medical" },
    { date: "2025-11-12", title: "Nicola Mors IVO", description: "Nicola Mors granted a 2-year Final IVO against Oliver.", category: "court" },
    { date: "2025-11-25", title: "Jessica Files Extension F&BP", description: "Jessica filed F&BP for IVO extension, seeking no-contact order until 2040.", category: "document" },
    { date: "2025-12-15", title: "Directions Hearing", description: "Directions Hearing for IVO extension. Adjourned to Contested Hearing.", category: "court" },
    { date: "2026-04-20", title: "Contested Hearing Scheduled", description: "Scheduled Contested Hearing for IVO extension at Moorabbin Magistrates' Court.", category: "court" }
  ];

  const correspondence = [
    { date: "2024-09-20", type: "Letter", sender: "Farrar Gesini Dunn", recipient: "Schetzer Papaleo", subject: "Interim Parenting Proposal", content: "Proposed supervised time by Kerri and Victor Vollembroich and bi-monthly urine screens.", status: "Logged" },
    { date: "2024-10-31", type: "Letter", sender: "Farrar Gesini Dunn", recipient: "Oliver Swan", subject: "IVO Hearing Outcome & Costs", content: "Advised on Final IVO without admissions. Total fees $17,454.40 to date.", status: "Logged" },
    { date: "2025-11-05", type: "Email", sender: "MCV Service Centre", recipient: "Oliver Swan", subject: "Interim Orders", content: "Court provided copies of interim orders after receiving photo ID.", status: "Logged" },
    { date: "2025-11-06", type: "Email", sender: "Oliver Swan", recipient: "CMA Law", subject: "Medical Evidence", content: "Oliver provided letters from Dr Anna Cunningham and Dr Rich Bradlow to lawyers.", status: "Logged" },
    { date: "2025-11-14", type: "Email", sender: "CMA Law", recipient: "Oliver Swan", subject: "Costs Agreement", content: "Sent costs agreement requiring $1,650 into trust before commencing work.", status: "Logged" },
    { date: "2025-11-27", type: "Email", sender: "Oliver Swan", recipient: "CMA Law", subject: "F&BP Response", content: "Oliver sent the F&BP and Greg Radford statement, stating he can respond to all points.", status: "Logged" },
    { date: "2025-12-11", type: "Email", sender: "MCV Service Centre", recipient: "Oliver Swan", subject: "Updated Hearing Notice", content: "Court provided updated hearing notice for 15 Dec 2025.", status: "Logged" }
  ];

  try {
    // Add Documents
    for (const docData of documents) {
      const q = query(collection(db, 'documents'), where('name', '==', docData.name), where('authorUid', '==', userUid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await addDoc(collection(db, 'documents'), {
          ...docData,
          authorUid: userUid,
          createdAt: serverTimestamp()
        });
      }
    }

    // Add Timeline Events
    for (const event of timelineEvents) {
      const q = query(collection(db, 'timeline_events'), where('title', '==', event.title), where('authorUid', '==', userUid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await addDoc(collection(db, 'timeline_events'), {
          ...event,
          authorUid: userUid,
          createdAt: serverTimestamp()
        });
      }
    }

    // Add Correspondence
    for (const corr of correspondence) {
      const q = query(collection(db, 'correspondence'), where('subject', '==', corr.subject), where('authorUid', '==', userUid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await addDoc(collection(db, 'correspondence'), {
          ...corr,
          authorUid: userUid,
          createdAt: serverTimestamp()
        });
      }
    }

    console.log("Database seeded successfully with 15 documents of data.");
    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    return false;
  }
};
