import React, { useState, useEffect, Component, ErrorInfo } from 'react';
import { 
  FolderOpen, 
  Clock, 
  FileText, 
  Scale, 
  Calendar, 
  Users, 
  AlertCircle,
  File,
  MessageSquare,
  Activity,
  ChevronRight,
  Search,
  UploadCloud,
  X,
  LogOut,
  Loader2,
  Sparkles,
  Shield,
  Plus,
  Trash2,
  Download,
  Brain,
  Send,
  Bot,
  User as UserIcon,
  ListChecks,
  Link,
  Edit3,
  PenTool,
  CheckSquare,
  Square,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, storage, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CORRESPONDENCE_DATA } from './correspondenceData';
import { seedDatabase } from './seedData';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import Markdown from 'react-markdown';

type Tab = 'OVERVIEW' | 'TIMELINE' | 'DOCUMENTS' | 'CORRESPONDENCE' | 'ALLEGATIONS' | 'AFFIDAVITS' | 'ACCESS' | 'MASTERMIND';

const ALLEGATIONS_DATA = [
  {
    title: 'Smashed mobile phone',
    description: 'Allegation that Oliver became aggressive, grabbed Jessica\'s phone and smashed it so it no longer worked on 11 January 2024.',
    date: '11 Jan 2024',
    source: 'Further and Better Particulars (07.10.2024)',
    status: 'Needs Evidence',
    response: '',
    linkedEvidence: []
  },
  {
    title: 'Illicit substance abuse',
    description: 'Allegation of consuming illicit substances (cocaine) during the relationship and excessive alcohol consumption.',
    date: 'Ongoing',
    source: 'Further and Better Particulars (07.10.2024)',
    status: 'Prepared',
    response: 'Completed U-Turn Men\'s Behaviour Change program. Provided clean urinalysis tests. Admitted to Malvern Private Hospital and Victoria Clinic for treatment and rehabilitation.',
    linkedEvidence: ['The Victoria Clinic Letters', 'Letter - Farrar Gesini Dunn (20.09.2024)']
  },
  {
    title: 'Leaving Oscar unsupervised',
    description: 'Allegation of leaving Oscar alone on the bed, awake and crawling, almost falling off.',
    date: 'Historical',
    source: 'Further and Better Particulars (07.10.2024)',
    status: 'Needs Evidence',
    response: '',
    linkedEvidence: []
  },
  {
    title: 'Severe nappy rash',
    description: 'Allegation that Oscar developed a severe rash on his bottom while in Oliver\'s care in August 2024, with no explanation provided.',
    date: 'August 2024',
    source: 'Further and Better Particulars (07.10.2024)',
    status: 'In Progress',
    response: 'Need to gather text messages with Greg Radford showing communication about Oscar\'s health and well-being during care times.',
    linkedEvidence: ['Text Thread - Greg Radford']
  },
  {
    title: 'Threatening to withhold Oscar',
    description: 'Allegation of sending a message threatening to withhold Oscar if Jessica did not agree to more overnight time.',
    date: '5 Mar 2024',
    source: 'Further and Better Particulars (07.10.2024)',
    status: 'Needs Evidence',
    response: '',
    linkedEvidence: []
  }
];

const CASE_SUMMARY = {
  title: "Swan v Radford",
  caseNumber: "Q10496489",
  court: "Moorabbin Magistrates' Court",
  status: "Active - Awaiting Contested Hearing",
  nextHearing: "20 April 2026 (Contested Hearing)",
  parties: {
    applicant: "Jessica Radford (Mother)",
    respondent: "Oliver Swan (Father)",
    child: "Oscar Swan (Born 17 Oct 2022)"
  },
  keyIssues: [
    "Application for Extension of Final IVO (seeking until 2040)",
    "Interim parenting arrangements and reinstatement of time",
    "Allegations of family violence and coercive control",
    "Allegations of substance abuse vs. evidence of rehabilitation",
    "Child support arrears dispute ($26,983.42 alleged)"
  ]
};

const TIMELINE_EVENTS = [
  { date: "Dec 2020", title: "Relationship Commenced", description: "Oliver and Jessica began their relationship.", category: "milestone" },
  { date: "17 Oct 2022", title: "Oscar Born", description: "Birth of their son, Oscar Swan.", category: "milestone" },
  { date: "11 Jan 2024", title: "Final Separation", description: "Parties separated. Alleged incident involving a smashed phone.", category: "alert" },
  { date: "19 Feb 2024", title: "Child Protection Report", description: "Maternal Child Health Nurse reported concerns regarding Oscar in Oliver's care.", category: "alert" },
  { date: "6 Mar 2024", title: "Initial IVO Application", description: "Victoria Police filed the initial IVO application.", category: "legal" },
  { date: "7 Mar 2024", title: "Letter from Schetzer Papaleo", description: "Jessica's lawyers requested hair follicle test, drug counselling, and Men's Behaviour Change Program.", category: "document" },
  { date: "19 Mar 2024", title: "Interim IVO Made", description: "Interim Intervention Order put in place.", category: "legal" },
  { date: "30 May 2024", title: "Interim IVO Extended", description: "Interim Intervention Order extended.", category: "legal" },
  { date: "18 Jul 2024", title: "IVO Hearing", description: "Oliver agreed to supervised time and clean urinalysis testing.", category: "legal" },
  { date: "26 Jul 2024", title: "Letter from Schetzer Papaleo", description: "Setting conditions for supervised time and demanding undertakings from Kerri & Victor Vollembroich.", category: "document" },
  { date: "12 Sep 2024", title: "Moorabbin Magistrates Court Hearing", description: "Victoria Police withdrew as Applicant. Matter proceeded on a without admissions basis.", category: "legal" },
  { date: "20 Sep 2024", title: "Letter from Farrar Gesini Dunn", description: "Oliver's lawyers proposed interim parenting arrangements and noted completion of U-Turn Men's Behaviour Change program.", category: "document" },
  { date: "7 Oct 2024", title: "Further & Better Particulars Filed", description: "Jessica filed initial F&B Particulars detailing historical allegations.", category: "document" },
  { date: "21 Oct 2024", title: "Final IVO Made", description: "Final IVO made for 12 months on a without admissions basis.", category: "legal" },
  { date: "31 Oct 2024", title: "Letter from Farrar Gesini Dunn", description: "Advice to Oliver regarding the Final IVO outcome and legal costs.", category: "document" },
  { date: "25 Dec 2024", title: "Christmas FaceTime", description: "Facilitated FaceTime call between Oliver and Oscar.", category: "event" },
  { date: "13-14 Jul 2025", title: "July Contact", description: "Oliver contacted Jessica directly, leading to a FaceTime call facilitated by Greg Radford.", category: "event" },
  { date: "17 Sep - 10 Oct 2025", title: "Malvern Private Hospital", description: "Oliver admitted as an inpatient for addiction treatment.", category: "medical" },
  { date: "20 Oct 2025", title: "Victoria Clinic Admission", description: "Oliver admitted to Dual Diagnosis inpatient program.", category: "medical" },
  { date: "11 Nov 2025", title: "Interim IVO Made", description: "A new Interim IVO was made protecting Jessica and Oscar.", category: "legal" },
  { date: "12 Nov 2025", title: "Final IVO Made (Nicola Mors)", description: "A 2-year Final IVO was granted against Oliver, protecting his former girlfriend, Nicola Mors.", category: "legal" },
  { date: "25 Nov 2025", title: "F&B Particulars for Extension", description: "Jessica filed F&B Particulars seeking to extend the Final IVO until 2040.", category: "document" },
  { date: "25 Nov 2025", title: "Witness Statement of Greg Radford", description: "Affidavit from Jessica's father detailing the FaceTime calls on Christmas 2024 and 14 July 2025.", category: "document" },
  { date: "15 Dec 2025", title: "Directions Hearing", description: "Scheduled Directions Hearing at Moorabbin Magistrates' Court. Matter adjourned to a Contested Hearing on 20 April 2026.", category: "legal" },
];

const DOCUMENTS = [
  { name: "Further and Better Particulars (07.10.2024)", type: "Court Filing", pages: 57, description: "Jessica's initial historical allegations of family violence." },
  { name: "Further and Better Particulars (25.11.2025)", type: "Court Filing", pages: 7, description: "Application to extend Final IVO until 2040, alleging recent breaches and ongoing risk." },
  { name: "Witness Statement of Greg Radford (25.11.2025)", type: "Court Filing", pages: 3, description: "Statement regarding Oliver's contact on Dec 25, 2024, and July 13-14, 2025." },
  { name: "Certified Extract (15.10.2025)", type: "Court Order", pages: 3, description: "Record of Interim Order extension." },
  { name: "Certified Extract (19.03.2024)", type: "Court Order", pages: 19, description: "Historical court extracts and interim orders." },
  { name: "Notice of Hearing (11.12.2025)", type: "Court Order", pages: 4, description: "Notice for Directions Hearing on 15 Dec 2025." },
  { name: "Malvern Private Hospital Letters", type: "Medical", pages: 2, description: "Confirmation of inpatient admission (17 Sep - 10 Oct 2025)." },
  { name: "The Victoria Clinic Letters", type: "Medical", pages: 2, description: "Dr. Bradlow and Dr. Cunningham confirming Dual Diagnosis program admission and clean drug tests." },
  { name: "Relationship Brief", type: "Client Notes", pages: 2, description: "Oliver's summary of the relationship and separation timeline." },
  { name: "Text Thread - Greg Radford", type: "Evidence", pages: 44, description: "Extensive SMS history between Oliver and Greg Radford regarding Oscar's care." },
  { name: "Letter - Schetzer Papaleo (07.03.2024)", type: "Correspondence", pages: 3, description: "Initial demands for drug testing and supervised time." },
  { name: "Letter - Schetzer Papaleo (26.07.2024)", type: "Correspondence", pages: 3, description: "Follow-up regarding urinalysis and professional supervision." },
  { name: "Letter - Farrar Gesini Dunn (20.09.2024)", type: "Correspondence", pages: 4, description: "Oliver's proposal for interim parenting and confirmation of U-Turn program completion." },
  { name: "Letter - Farrar Gesini Dunn (31.10.2024)", type: "Correspondence", pages: 4, description: "Advice regarding the Final IVO made without admissions." },
  { name: "Final IVO (21.10.2024)", type: "Court Order", pages: 3, description: "The 12-month Final Intervention Order." },
  { name: "Oliver Swan Passport", type: "Evidence", pages: 1, description: "Photo of Oliver Swan's Australian Passport." },
  { name: "Email Chain - Court Documents", type: "Correspondence", pages: 44, description: "Emails between Oliver, CMA Law, and the MCV Service Centre regarding court documents and legal representation." }
];

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-slate-200">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Application Error</h2>
            <p className="text-slate-600 mb-6">
              The application encountered an unexpected error. This usually happens when the database security rules are updating or if there's a connection issue.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-8 text-left overflow-auto max-h-32">
              <p className="text-xs text-slate-500 font-mono break-words">
                {this.state.error?.message || "Unknown error occurred."}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors w-full"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const getDocUrl = (doc: any) => {
  if (doc.fileUrl) return doc.fileUrl;
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${doc.name}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; line-height: 1.6; color: #334155; max-width: 800px; margin: 0 auto; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 8px; }
    .meta { color: #64748b; font-size: 0.9em; margin-bottom: 32px; font-weight: 500; }
    h2 { color: #334155; margin-top: 32px; font-size: 1.25rem; }
    .content-box { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; white-space: pre-wrap; }
    .footer { margin-top: 48px; font-size: 0.85em; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>${doc.name}</h1>
  <div class="meta">Type: ${doc.type || 'Document'} | Status: ${doc.aiProcessed ? 'AI Processed' : 'Unprocessed'}</div>
  
  <h2>Description</h2>
  <div class="content-box">${doc.description || 'No description available.'}</div>
  
  ${doc.summary ? `
  <h2>AI Summary</h2>
  <div class="content-box">${doc.summary}</div>
  ` : ''}
  
  ${doc.keyDetails ? `
  <h2>Key Details</h2>
  <div class="content-box">${doc.keyDetails}</div>
  ` : ''}
  
  <div class="footer">
    Note: This is an AI-generated text representation of the original document for preview purposes.
  </div>
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
};

function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [timelineSearchQuery, setTimelineSearchQuery] = useState('');
  const [correspondenceSearchQuery, setCorrespondenceSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Firebase State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [correspondence, setCorrespondence] = useState<any[]>([]);
  const [allegations, setAllegations] = useState<any[]>([]);
  const [authorizedEmails, setAuthorizedEmails] = useState<any[]>([]);
  const [newAuthEmail, setNewAuthEmail] = useState('');
  const [isAddingAuthEmail, setIsAddingAuthEmail] = useState(false);
  
  // Upload Form State
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('Evidence');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [useAIProcessing, setUseAIProcessing] = useState(true);
  const [aiProgress, setAiProgress] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  
  // Mastermind State
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Affidavit Builder State
  const [selectedTimelineIds, setSelectedTimelineIds] = useState<Set<string>>(new Set());
  const [affidavitDraft, setAffidavitDraft] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [affidavitTopic, setAffidavitTopic] = useState('');

  // Claim Modal State
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [claimForm, setClaimForm] = useState({
    title: '', date: '', source: '', status: 'Needs Evidence', description: '', response: '', linkedEvidence: [] as string[], linkedEvents: [] as string[]
  });

  // Email Scanner State
  const [isScanningEmail, setIsScanningEmail] = useState(false);
  const [scannedEmails, setScannedEmails] = useState<any[]>([]);
  const [showEmailScanner, setShowEmailScanner] = useState(false);
  const [emailScanQuery, setEmailScanQuery] = useState('Radford OR Swan OR "Farrar Gesini Dunn" OR "Schetzer Papaleo" OR IVO');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Ensure user document exists
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: currentUser.email,
              role: currentUser.email === 'oliverjs090@gmail.com' ? 'admin' : 'user',
              createdAt: serverTimestamp()
            });
          }
          
          // Bootstrap data if empty
          bootstrapData(currentUser.uid);
        } catch (error) {
          console.error("Error setting up user:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthReady) return;

    const docsQuery = query(collection(db, 'documents'), where('authorUid', '==', user.uid));
    const unsubDocs = onSnapshot(docsQuery, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docsData.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setDocuments(docsData);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'documents'));

    const timelineQuery = query(collection(db, 'timeline_events'), where('authorUid', '==', user.uid));
    const unsubTimeline = onSnapshot(timelineQuery, (snapshot) => {
      const timelineData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      timelineData.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setTimelineEvents(timelineData);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'timeline_events'));

    const correspondenceQuery = query(collection(db, 'correspondence'), where('authorUid', '==', user.uid));
    const unsubCorrespondence = onSnapshot(correspondenceQuery, (snapshot) => {
      const corrData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      corrData.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setCorrespondence(corrData);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'correspondence'));

    const allegationsQuery = query(collection(db, 'allegations'), where('authorUid', '==', user.uid));
    const unsubAllegations = onSnapshot(allegationsQuery, (snapshot) => {
      const algData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      algData.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setAllegations(algData);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'allegations'));

    const authEmailsQuery = query(collection(db, 'authorized_emails'), orderBy('createdAt', 'desc'));
    const unsubAuthEmails = onSnapshot(authEmailsQuery, (snapshot) => {
      const emailsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAuthorizedEmails(emailsData);
    }, (error) => {
      console.log("Authorized emails listener (expected to fail for non-admins):", error.message);
    });

    return () => {
      unsubDocs();
      unsubTimeline();
      unsubCorrespondence();
      unsubAllegations();
      unsubAuthEmails();
    };
  }, [user, isAuthReady]);

  const bootstrapData = async (uid: string) => {
    try {
      const docsSnap = await getDocs(query(collection(db, 'documents'), where('authorUid', '==', uid)));
      if (docsSnap.empty) {
        for (const docItem of DOCUMENTS) {
          await addDoc(collection(db, 'documents'), {
            name: docItem.name,
            type: docItem.type,
            pages: docItem.pages,
            description: docItem.description,
            authorUid: uid,
            createdAt: serverTimestamp()
          });
        }
      }

      const timelineSnap = await getDocs(query(collection(db, 'timeline_events'), where('authorUid', '==', uid)));
      if (timelineSnap.empty) {
        for (const event of TIMELINE_EVENTS) {
          await addDoc(collection(db, 'timeline_events'), {
            date: event.date,
            title: event.title,
            description: event.description,
            category: event.category,
            authorUid: uid,
            createdAt: serverTimestamp()
          });
        }
      }

      const corrSnap = await getDocs(query(collection(db, 'correspondence'), where('authorUid', '==', uid)));
      if (corrSnap.empty) {
        for (const corr of CORRESPONDENCE_DATA) {
          await addDoc(collection(db, 'correspondence'), {
            date: corr.date,
            type: corr.type,
            sender: corr.sender,
            recipient: corr.recipient,
            subject: corr.subject,
            content: corr.content,
            status: corr.status,
            authorUid: uid,
            createdAt: serverTimestamp()
          });
        }
      }

      const algSnap = await getDocs(query(collection(db, 'allegations'), where('authorUid', '==', uid)));
      if (algSnap.empty) {
        for (const alg of ALLEGATIONS_DATA) {
          await addDoc(collection(db, 'allegations'), {
            ...alg,
            authorUid: uid,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error("Bootstrap error:", error);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  useEffect(() => {
    if (!previewDoc) {
      setAnalysis('');
      setIsAnalyzing(false);
    }
  }, [previewDoc]);

  const handleAnalyze = async () => {
    if (!previewDoc) return;
    setIsAnalyzing(true);
    setAnalysis('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const parts: any[] = [];
      
      const docUrl = getDocUrl(previewDoc);
      const response = await fetch(docUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          resolve(base64data);
        };
      });
      const base64Data = await base64Promise;
      
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: blob.type || 'application/pdf'
        }
      });
      parts.push({ text: `You are a strict legal assistant. Analyze ONLY the provided document. If the document is unreadable or empty, state that clearly. DO NOT guess, infer, or hallucinate any contents. Extract key entities, dates, and summarize the main legal or factual points based STRICTLY on the text within the document. Title: ${previewDoc.name}. Type: ${previewDoc.type}. Description: ${previewDoc.description}.` });

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: { parts },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      for await (const chunk of responseStream) {
        setAnalysis(prev => prev + (chunk.text || ''));
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      setAnalysis("Error analyzing document: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !previewDoc) return;
    
    setIsUploading(true);
    try {
      const fileRef = ref(storage, `documents/${user.uid}/${Date.now()}_${file.name}`);
      const metadata = { contentType: file.type || 'application/pdf' };
      await uploadBytes(fileRef, file, metadata);
      const url = await getDownloadURL(fileRef);
      
      const docRef = doc(db, 'documents', previewDoc.id);
      await setDoc(docRef, { fileUrl: url }, { merge: true });
      
      setPreviewDoc({ ...previewDoc, fileUrl: url });
    } catch (error: any) {
      console.error("Attach error:", error);
      alert("Failed to attach file: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const processDocumentWithAI = async (file: File, docId: string) => {
    try {
      const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'];
      if (!supportedTypes.includes(file.type)) {
        console.warn("File type not supported for AI analysis:", file.type);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });

      const prompt = `Analyze this legal document for a family law / IVO case. 
      1. Categorize the document type (e.g., Affidavit, Police Report, Correspondence, Medical Record, Financial).
      2. Provide a concise summary.
      3. Highlight key details.
      4. Extract any specific timeline events mentioned (dates, what happened).
      
      Return ONLY a JSON object matching this schema:
      {
        "type": "string",
        "summary": "string",
        "keyDetails": "string",
        "timelineEvents": [
          { "date": "YYYY-MM-DD or approximate", "title": "string", "description": "string" }
        ]
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
          { inlineData: { data: base64, mimeType: file.type } },
          { text: prompt }
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      await updateDoc(doc(db, 'documents', docId), {
        type: result.type || uploadType,
        summary: result.summary || '',
        keyDetails: result.keyDetails || '',
        aiProcessed: true
      });

      if (result.timelineEvents && Array.isArray(result.timelineEvents)) {
        for (const event of result.timelineEvents) {
          await addDoc(collection(db, 'timeline_events'), {
            date: event.date,
            title: event.title,
            description: `(Auto-extracted from ${file.name}): ${event.description}`,
            authorUid: user?.uid,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error("AI Processing failed:", error);
    }
  };

  const handleBulkProcess = async () => {
    const unprocessedDocs = documents.filter(d => !d.aiProcessed);
    if (unprocessedDocs.length === 0) {
      return;
    }

    setIsBulkProcessing(true);
    let processedCount = 0;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    for (const docData of unprocessedDocs) {
      try {
        setBulkProgress(`Processing ${processedCount + 1} of ${unprocessedDocs.length}: ${docData.name}...`);
        
        const url = docData.fileUrl || docData.url;
        if (!url) continue;

        // Fetch the file from Firebase Storage
        const response = await fetch(url);
        const blob = await response.blob();
        
        const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'];
        if (!supportedTypes.includes(blob.type)) {
          console.warn("File type not supported for AI analysis:", blob.type);
          continue;
        }

        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });

        const prompt = `Analyze this legal document for a family law / IVO case. 
        1. Categorize the document type (e.g., Affidavit, Police Report, Correspondence, Medical Record, Financial).
        2. Provide a concise summary.
        3. Highlight key details.
        4. Extract any specific timeline events mentioned (dates, what happened).
        
        Return ONLY a JSON object matching this schema:
        {
          "type": "string",
          "summary": "string",
          "keyDetails": "string",
          "timelineEvents": [
            { "date": "YYYY-MM-DD or approximate", "title": "string", "description": "string" }
          ]
        }`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: [
            { inlineData: { data: base64, mimeType: blob.type } },
            { text: prompt }
          ],
          config: {
            responseMimeType: "application/json",
          }
        });

        const result = JSON.parse(aiResponse.text || '{}');
        
        await updateDoc(doc(db, 'documents', docData.id), {
          type: result.type || docData.type,
          summary: result.summary || '',
          keyDetails: result.keyDetails || '',
          aiProcessed: true
        });

        if (result.timelineEvents && Array.isArray(result.timelineEvents)) {
          for (const event of result.timelineEvents) {
            await addDoc(collection(db, 'timeline_events'), {
              date: event.date,
              title: event.title,
              description: `(Auto-extracted from ${docData.name}): ${event.description}`,
              authorUid: user?.uid,
              createdAt: serverTimestamp()
            });
          }
        }
        
        processedCount++;
      } catch (error) {
        console.error(`Failed to process document ${docData.name}:`, error);
      }
    }

    setBulkProgress('');
    setIsBulkProcessing(false);
  };

  const handleUpload = async () => {
    if (!uploadName || !uploadDesc || !user || !uploadFile) return;
    
    // Check for duplicates
    if (documents.some(doc => doc.name.toLowerCase() === uploadName.toLowerCase())) {
      setUploadError('A document with this name already exists in your vault.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setAiProgress('Uploading file to secure vault...');
    try {
      // 1. Upload file to Firebase Storage
      const fileRef = ref(storage, `documents/${user.uid}/${Date.now()}_${uploadFile.name}`);
      const metadata = { contentType: uploadFile.type || 'application/pdf' };
      await uploadBytes(fileRef, uploadFile, metadata);
      const fileUrl = await getDownloadURL(fileRef);

      // 2. Save metadata to Firestore
      const docRef = await addDoc(collection(db, 'documents'), {
        name: uploadName,
        type: uploadType,
        pages: 1,
        description: uploadDesc,
        fileUrl: fileUrl,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
        aiProcessed: false
      });
      
      // 3. Auto-add to timeline
      const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      await addDoc(collection(db, 'timeline_events'), {
        date: today,
        title: `Uploaded: ${uploadName}`,
        description: uploadDesc,
        category: 'document',
        authorUid: user.uid,
        createdAt: serverTimestamp()
      });

      if (useAIProcessing) {
        setAiProgress('AI is analyzing document and extracting timeline events...');
        await processDocumentWithAI(uploadFile, docRef.id);
      }

      setIsUploadModalOpen(false);
      setUploadName('');
      setUploadDesc('');
      setUploadFile(null);
      setAiProgress('');
    } catch (error) {
      console.error("Upload failed:", error);
      // Fallback if storage fails (e.g. rules not set up perfectly)
      try {
        const docRef = await addDoc(collection(db, 'documents'), {
          name: uploadName,
          type: uploadType,
          pages: 1,
          description: uploadDesc,
          authorUid: user.uid,
          createdAt: serverTimestamp(),
          aiProcessed: false
        });

        if (useAIProcessing) {
          setAiProgress('AI is analyzing document and extracting timeline events...');
          await processDocumentWithAI(uploadFile, docRef.id);
        }

        setIsUploadModalOpen(false);
        setUploadName('');
        setUploadDesc('');
        setUploadFile(null);
        setAiProgress('');
      } catch (fallbackError) {
        handleFirestoreError(fallbackError, OperationType.CREATE, 'documents');
      }
    } finally {
      setIsUploading(false);
      setAiProgress('');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const newUserMsg = { role: 'user' as const, text: chatInput };
    setChatMessages(prev => [...prev, newUserMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const context = `You are an expert legal case manager and paralegal strategist assisting Oliver Swan in his family law and IVO matters in Victoria, Australia.
      You have deep knowledge of the Family Violence Protection Act 2008 (Vic) and the Family Law Act 1975.
      
      Here is the current case data you have access to:
      Documents in Vault: ${documents.map(d => `${d.name} (${d.type}) - ${d.summary || d.description}`).join('\n')}
      Timeline Events: ${timelineEvents.map(t => `${t.date}: ${t.title} - ${t.description}`).join('\n')}
      Opposing Claims/Allegations: ${allegations.map(a => `${a.title} (${a.date}): ${a.description} | Our Response: ${a.response || 'None yet'}`).join('\n')}
      Correspondence: ${correspondence.map(c => `${c.date}: ${c.type} from ${c.sender} to ${c.recipient} - ${c.subject}`).join('\n')}

      Analyze the user's request strategically, refer to the case data, and provide actionable, objective legal case management advice. Do not provide formal legal advice, but act as a highly intelligent paralegal/strategist. Help draft responses, analyze risks, and suggest next steps. If asked about Victorian law, reference relevant acts or thresholds.`;

      const contents = chatMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: newUserMsg.text }] });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: contents,
        config: { systemInstruction: context }
      });

      setChatMessages(prev => [...prev, { role: 'model', text: response.text || '' }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'model', text: 'Error: Could not process request. Please check your connection or try again.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateAffidavit = async () => {
    if (selectedTimelineIds.size === 0) {
      alert("Please select at least one timeline event to include in the affidavit.");
      return;
    }
    setIsDrafting(true);
    setAffidavitDraft('');

    try {
      const selectedEvents = timelineEvents.filter(e => selectedTimelineIds.has(e.id));
      const eventText = selectedEvents.map((e, i) => `${i + 1}. On or around ${e.date}, ${e.title}: ${e.description}`).join('\n');

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are an expert family law paralegal in Victoria, Australia. 
      Draft a formal affidavit or legal response for Oliver Swan based on the following selected timeline events. 
      
      Topic/Focus of Draft: ${affidavitTopic || 'General Response'}
      
      Selected Events to include:
      ${eventText}
      
      Format it strictly as a formal legal document with numbered paragraphs. Use objective, factual, and professional language suitable for the Magistrates' Court of Victoria or Federal Circuit and Family Court of Australia. Do not invent facts; rely ONLY on the provided events.`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      for await (const chunk of responseStream) {
        setAffidavitDraft(prev => prev + (chunk.text || ''));
      }
    } catch (error: any) {
      console.error("Drafting error:", error);
      setAffidavitDraft("Error generating affidavit: " + error.message);
    } finally {
      setIsDrafting(false);
    }
  };

  const toggleTimelineSelection = (id: string) => {
    const newSet = new Set(selectedTimelineIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTimelineIds(newSet);
  };

  const handleScanEmail = async () => {
    setIsScanningEmail(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      
      // Force prompt to ensure we get the access token
      provider.setCustomParameters({
        prompt: 'consent'
      });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        throw new Error("Could not get Gmail access token.");
      }

      // Call Gmail API
      const query = encodeURIComponent(emailScanQuery);
      const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=15`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const listData = await listRes.json();

      if (!listData.messages) {
        setScannedEmails([]);
        setIsScanningEmail(false);
        setShowEmailScanner(true);
        return;
      }

      const emails = [];
      for (const msg of listData.messages) {
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const msgData = await msgRes.json();
        
        const headers = msgData.payload.headers;
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
        const to = headers.find((h: any) => h.name === 'To')?.value || 'Unknown';
        const date = headers.find((h: any) => h.name === 'Date')?.value || '';

        emails.push({
          id: msg.id,
          subject,
          sender: from,
          recipient: to,
          date: new Date(date).toLocaleDateString(),
          snippet: msgData.snippet,
          content: msgData.snippet,
          type: 'Email',
          status: 'Scanned'
        });
      }

      setScannedEmails(emails);
      setShowEmailScanner(true);
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        // User intentionally closed the popup or browser blocked it. Fail gracefully.
        console.log("Gmail scan cancelled by user or popup blocked.");
        alert("The Google sign-in popup was closed or blocked. Please ensure popups are allowed, or try opening the app in a new tab (using the button in the top right) to connect your Gmail.");
      } else {
        console.error("Error scanning email:", error);
        alert("Failed to scan email. Make sure you grant Gmail permissions. Error: " + (error?.message || "Unknown error"));
      }
    } finally {
      setIsScanningEmail(false);
    }
  };

  const handleImportEmail = async (email: any) => {
    try {
      await addDoc(collection(db, 'correspondence'), {
        date: email.date,
        type: 'Email',
        sender: email.sender,
        recipient: email.recipient,
        subject: email.subject,
        content: email.content,
        status: 'Logged',
        authorUid: user?.uid,
        createdAt: serverTimestamp()
      });
      // Remove from scanned list
      setScannedEmails(prev => prev.filter(e => e.id !== email.id));
    } catch (error) {
      console.error("Error importing email:", error);
      alert("Failed to import email.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setUploadError('');
      if (!uploadName) {
        // Auto-fill name from filename without extension
        setUploadName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadFile(file);
      setUploadError('');
      if (!uploadName) {
        setUploadName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const openClaimModal = (claim?: any) => {
    if (claim) {
      setEditingClaimId(claim.id);
      setClaimForm({
        title: claim.title || '',
        date: claim.date || '',
        source: claim.source || '',
        status: claim.status || 'Needs Evidence',
        description: claim.description || '',
        response: claim.response || '',
        linkedEvidence: claim.linkedEvidence || [],
        linkedEvents: claim.linkedEvents || []
      });
    } else {
      setEditingClaimId(null);
      setClaimForm({
        title: '', date: '', source: '', status: 'Needs Evidence', description: '', response: '', linkedEvidence: [], linkedEvents: []
      });
    }
    setIsClaimModalOpen(true);
  };

  const handleSaveClaim = async () => {
    if (!user) return;
    try {
      if (editingClaimId) {
        await updateDoc(doc(db, 'allegations', editingClaimId), {
          ...claimForm,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'allegations'), {
          ...claimForm,
          authorUid: user.uid,
          createdAt: serverTimestamp()
        });
      }
      setIsClaimModalOpen(false);
    } catch (error) {
      console.error("Error saving claim:", error);
      alert("Failed to save claim.");
    }
  };

  const handleDeleteClaim = async (id: string) => {
    if (!confirm("Are you sure you want to delete this claim?")) return;
    try {
      await deleteDoc(doc(db, 'allegations', id));
    } catch (error) {
      console.error("Error deleting claim:", error);
    }
  };

  const handleAddAuthorizedEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthEmail || !user) return;
    setIsAddingAuthEmail(true);
    try {
      const emailRef = doc(db, 'authorized_emails', newAuthEmail.toLowerCase());
      await setDoc(emailRef, {
        email: newAuthEmail.toLowerCase(),
        role: 'viewer',
        addedBy: user.uid,
        createdAt: serverTimestamp()
      });
      setNewAuthEmail('');
    } catch (error: any) {
      console.error("Failed to add email:", error);
      alert("Failed to add authorized email: " + error.message);
    } finally {
      setIsAddingAuthEmail(false);
    }
  };

  const handleRemoveAuthorizedEmail = async (emailId: string) => {
    if (!confirm("Are you sure you want to remove access for this email?")) return;
    try {
      await deleteDoc(doc(db, 'authorized_emails', emailId));
    } catch (error: any) {
      console.error("Failed to remove email:", error);
      alert("Failed to remove authorized email: " + error.message);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">CaseVault</h1>
          <p className="text-slate-600 mb-8">The secure Client-Lawyer portal for evidence, timelines, and case prep.</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTimeline = timelineEvents.filter(event => 
    event.title.toLowerCase().includes(timelineSearchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(timelineSearchQuery.toLowerCase()) ||
    event.date.toLowerCase().includes(timelineSearchQuery.toLowerCase())
  );

  const filteredCorrespondence = correspondence.filter(corr => 
    corr.subject?.toLowerCase().includes(correspondenceSearchQuery.toLowerCase()) ||
    corr.content?.toLowerCase().includes(correspondenceSearchQuery.toLowerCase()) ||
    corr.sender?.toLowerCase().includes(correspondenceSearchQuery.toLowerCase()) ||
    corr.recipient?.toLowerCase().includes(correspondenceSearchQuery.toLowerCase())
  );

  const handleSeedDatabase = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      await seedDatabase(db, user.uid);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSeeding(false);
    }
  };

  const isAdmin = user?.email === 'oliverjs090@gmail.com';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 shrink-0 shadow-sm z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">CaseVault</h1>
              <p className="text-sm text-slate-500 font-medium">Client-Lawyer Portal | {CASE_SUMMARY.title}</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {isAdmin && (
              <button 
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full border border-purple-200 hover:bg-purple-200 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isSeeding ? 'Loading...' : 'Load Provided Documents'}
              </button>
            )}
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full border border-amber-200 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Next: {CASE_SUMMARY.nextHearing}
            </span>
            <button 
              onClick={() => signOut(auth)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex gap-8 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 shrink-0 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'OVERVIEW' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Activity className="w-5 h-5" />
            Case Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'DOCUMENTS' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <FolderOpen className="w-5 h-5" />
            Evidence Vault
          </button>
          <button 
            onClick={() => setActiveTab('TIMELINE')}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'TIMELINE' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Clock className="w-5 h-5" />
            Chronology
          </button>
          <button 
            onClick={() => setActiveTab('ALLEGATIONS')}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'ALLEGATIONS' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <ListChecks className="w-5 h-5" />
            Claims & Rebuttals
          </button>
          <button 
            onClick={() => setActiveTab('CORRESPONDENCE')}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'CORRESPONDENCE' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <MessageSquare className="w-5 h-5" />
            Communications
          </button>
          <button 
            onClick={() => setActiveTab('MASTERMIND')}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'MASTERMIND' ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Brain className="w-5 h-5" />
            AI Paralegal
          </button>
          <button 
            onClick={() => setActiveTab('AFFIDAVITS')}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'AFFIDAVITS' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <PenTool className="w-5 h-5" />
            Drafting
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('ACCESS')}
              className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'ACCESS' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Shield className="w-5 h-5" />
              Shared Access
            </button>
          )}
        </aside>

        {/* Content Area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-y-auto">
          <AnimatePresence mode="wait">
            
            {activeTab === 'OVERVIEW' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 flex flex-col gap-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Case Dashboard</h2>
                  <p className="text-slate-600">High-level overview of the current proceedings and status.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Parties
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500">Applicant</p>
                        <p className="font-medium text-slate-900">{CASE_SUMMARY.parties.applicant}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Respondent</p>
                        <p className="font-medium text-slate-900">{CASE_SUMMARY.parties.respondent}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Child</p>
                        <p className="font-medium text-slate-900">{CASE_SUMMARY.parties.child}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Scale className="w-4 h-4" /> Status
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500">Court</p>
                        <p className="font-medium text-slate-900">{CASE_SUMMARY.court}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Current Status</p>
                        <p className="font-medium text-slate-900">{CASE_SUMMARY.status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Next Event</p>
                        <p className="font-medium text-blue-600">{CASE_SUMMARY.nextHearing}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Key Issues & Disputes</h3>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {CASE_SUMMARY.keyIssues.map((issue, idx) => (
                      <div key={idx} className="p-4 border-b border-slate-100 last:border-0 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-slate-700">{issue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'MASTERMIND' && (
              <motion.div 
                key="mastermind"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col h-full bg-slate-50"
              >
                <div className="p-6 border-b border-slate-200 bg-white shrink-0">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-600" /> AI Paralegal
                  </h2>
                  <p className="text-slate-600">Your intelligent case manager. Ask questions, draft responses, or analyze risks based on your entire case file.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                        <Bot className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Your AI Paralegal is ready.</h3>
                      <p className="text-slate-500 mb-8">I have full access to the Evidence Vault, Chronology, and Communications. Try asking me to:</p>
                      <div className="flex flex-col gap-3 w-full">
                        <button onClick={() => setChatInput("Draft a response to the September 20th letter from Farrar Gesini Dunn regarding mediation.")} className="p-3 text-sm text-left border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-slate-700">
                          "Draft a response to the Sept 20th letter from Farrar Gesini Dunn..."
                        </button>
                        <button onClick={() => setChatInput("What are the main inconsistencies in Jessica's timeline of events?")} className="p-3 text-sm text-left border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-slate-700">
                          "What are the main inconsistencies in Jessica's timeline?"
                        </button>
                        <button onClick={() => setChatInput("Based on the uploaded documents, what are my immediate action items?")} className="p-3 text-sm text-left border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-slate-700">
                          "What are my immediate action items?"
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-1">
                              <Bot className="w-5 h-5 text-purple-600" />
                            </div>
                          )}
                          <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-sm' : 'bg-white border border-slate-200 shadow-sm rounded-tl-sm'}`}>
                            {msg.role === 'user' ? (
                              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            ) : (
                              <div className="prose prose-sm prose-slate max-w-none">
                                <Markdown>{msg.text}</Markdown>
                              </div>
                            )}
                          </div>
                          {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1">
                              <UserIcon className="w-5 h-5 text-slate-600" />
                            </div>
                          )}
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex gap-4 justify-start">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-1">
                            <Bot className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                            <span className="text-sm text-slate-500 font-medium">Analyzing case files...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                  <div className="max-w-4xl mx-auto relative">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask your AI Paralegal about your case..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors resize-none min-h-[52px] max-h-32"
                      rows={1}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="absolute right-2 bottom-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-2">The AI Paralegal analyzes your uploaded documents and timeline to provide strategic insights.</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'TIMELINE' && (
              <motion.div 
                key="timeline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 flex flex-col gap-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Chronology</h2>
                    <p className="text-slate-600">Complete history of relationship, incidents, and legal proceedings.</p>
                  </div>
                  <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search timeline..." 
                      value={timelineSearchQuery}
                      onChange={(e) => setTimelineSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                    />
                  </div>
                </div>

                <div className="relative border-l-2 border-slate-200 ml-4 mt-4 space-y-8 pb-8">
                  {filteredTimeline.map((event, idx) => (
                    <div key={idx} className="relative pl-8">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                        event.category === 'legal' ? 'bg-blue-500' :
                        event.category === 'alert' ? 'bg-red-500' :
                        event.category === 'document' ? 'bg-slate-500' :
                        event.category === 'medical' ? 'bg-emerald-500' :
                        'bg-amber-500'
                      }`} />
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-500">{event.date}</span>
                        <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                        <p className="text-slate-600 mt-1">{event.description}</p>
                      </div>
                    </div>
                  ))}
                  {filteredTimeline.length === 0 && (
                    <div className="text-center py-12 text-slate-500 ml-[-1rem]">
                      No events found matching "{timelineSearchQuery}"
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'DOCUMENTS' && (
              <motion.div 
                key="documents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 flex flex-col gap-6 h-full"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Evidence Vault</h2>
                    <p className="text-slate-600">Organized repository of all case files and evidence.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {documents.some(d => !d.aiProcessed) && (
                      <button 
                        onClick={handleBulkProcess}
                        disabled={isBulkProcessing}
                        className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {isBulkProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isBulkProcessing ? bulkProgress : 'Run AI Analysis on All'}
                      </button>
                    )}
                    <div className="relative">
                      <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search documents..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                      />
                    </div>
                    <button 
                      onClick={() => setIsUploadModalOpen(true)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Upload Files
                    </button>
                  </div>
                </div>

                <div className="grid gap-3">
                  {filteredDocs.map((doc, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setPreviewDoc(doc)}
                      className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${
                          doc.type === 'Court Filing' || doc.type === 'Court Order' ? 'bg-blue-50 text-blue-600' :
                          doc.type === 'Medical' ? 'bg-emerald-50 text-emerald-600' :
                          doc.type === 'Evidence' ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {doc.type === 'Evidence' ? <MessageSquare className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{doc.name}</h3>
                          <p className="text-sm text-slate-500 mt-0.5">{doc.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-medium text-slate-400 uppercase">{doc.type}</span>
                          <span className="text-xs text-slate-500">{doc.pages || '1'} pages</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewDoc(doc);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            Preview
                          </button>
                          <a 
                            href={getDocUrl(doc)}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={doc.fileUrl ? undefined : `${doc.name}.html`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <Download className="w-4 h-4" /> Download
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredDocs.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      No documents found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'CORRESPONDENCE' && (
              <motion.div 
                key="correspondence"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 flex flex-col gap-6 h-full"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Communications</h2>
                    <p className="text-slate-600">Log of all emails, text messages, and formal letters.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-72">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search correspondence..." 
                        value={correspondenceSearchQuery}
                        onChange={(e) => setCorrespondenceSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button 
                      onClick={handleScanEmail}
                      disabled={isScanningEmail}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isScanningEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      Scan Gmail
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {filteredCorrespondence.map((corr, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            corr.type === 'Email' ? 'bg-purple-50 text-purple-600' :
                            corr.type === 'Text Message' ? 'bg-green-50 text-green-600' :
                            corr.type === 'Medical Letter' ? 'bg-rose-50 text-rose-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{corr.subject}</h3>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                              <span className="font-medium text-slate-700">{corr.sender}</span>
                              <ChevronRight className="w-3 h-3" />
                              <span className="font-medium text-slate-700">{corr.recipient}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {corr.date}
                          </span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            corr.status === 'Sent' ? 'bg-blue-50 text-blue-700' :
                            corr.status === 'Received' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {corr.status}
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {corr.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {filteredCorrespondence.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      No correspondence found matching "{correspondenceSearchQuery}"
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'ALLEGATIONS' && (
              <motion.div 
                key="allegations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 flex flex-col gap-6 h-full"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Claims & Rebuttals</h2>
                    <p className="text-slate-600">Track opposing claims, draft your rebuttals, and link supporting evidence.</p>
                  </div>
                  <button onClick={() => openClaimModal()} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {allegations.map((alg) => (
                    <div key={alg.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{alg.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{alg.date}</span>
                            <span className="text-xs text-slate-500">Source: {alg.source}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            alg.status === 'Prepared' ? 'bg-emerald-100 text-emerald-700' :
                            alg.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {alg.status}
                          </span>
                          <button onClick={() => openClaimModal(alg)} className="text-slate-400 hover:text-blue-600 transition-colors p-1">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteClaim(alg.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="font-semibold text-slate-900 block mb-1">Claim:</span>
                          {alg.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-slate-900">Our Response</h4>
                          </div>
                          {alg.response ? (
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{alg.response}</p>
                          ) : (
                            <p className="text-sm text-slate-400 italic">No response drafted yet. Click edit to add defense strategy.</p>
                          )}
                        </div>
                        
                        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-bold text-slate-900">Linked Evidence</h4>
                            </div>
                            {alg.linkedEvidence && alg.linkedEvidence.length > 0 ? (
                              <ul className="space-y-2">
                                {alg.linkedEvidence.map((docIdOrName: string, idx: number) => {
                                  const doc = documents.find(d => d.id === docIdOrName || d.name === docIdOrName);
                                  return (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-700 bg-white p-2 rounded border border-slate-200">
                                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                      <span className="truncate">{doc ? doc.name : docIdOrName}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-400 italic">No evidence linked.</p>
                            )}
                          </div>
                          
                          {alg.linkedEvents && alg.linkedEvents.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-slate-900">Linked Timeline Events</h4>
                              </div>
                              <ul className="space-y-2">
                                {alg.linkedEvents.map((eventId: string, idx: number) => {
                                  const event = timelineEvents.find(e => e.id === eventId);
                                  if (!event) return null;
                                  return (
                                    <li key={idx} className="flex flex-col gap-1 text-sm text-slate-700 bg-white p-2 rounded border border-slate-200">
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="font-semibold truncate">{event.date}</span>
                                      </div>
                                      <span className="truncate text-xs text-slate-500">{event.title}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'AFFIDAVITS' && (
              <motion.div 
                key="affidavits"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex h-full overflow-hidden"
              >
                {/* Left Panel: Selection */}
                <div className="w-1/2 border-r border-slate-200 flex flex-col bg-slate-50">
                  <div className="p-6 border-b border-slate-200 bg-white">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Drafting</h2>
                    <p className="text-slate-600 text-sm">Select the facts and timeline events you want to include in your draft.</p>
                  </div>
                  
                  <div className="p-4 border-b border-slate-200 bg-white">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Topic / Focus of Draft</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Response to specific allegations, Parenting capacity..." 
                      value={affidavitTopic}
                      onChange={(e) => setAffidavitTopic(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Select Timeline Events</h3>
                    {timelineEvents.map((event) => (
                      <div 
                        key={event.id} 
                        onClick={() => toggleTimelineSelection(event.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex gap-3 ${selectedTimelineIds.has(event.id) ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-200'}`}
                      >
                        <div className="mt-0.5">
                          {selectedTimelineIds.has(event.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-500">{event.date}</span>
                            <span className="text-sm font-bold text-slate-900">{event.title}</span>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Panel: Draft Output */}
                <div className="w-1/2 flex flex-col bg-white">
                  <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" /> AI Draft
                    </h3>
                    <button 
                      onClick={handleGenerateAffidavit}
                      disabled={isDrafting || selectedTimelineIds.size === 0}
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      {isDrafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                      {isDrafting ? 'Drafting...' : 'Generate Draft'}
                    </button>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
                    {affidavitDraft ? (
                      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm prose prose-sm prose-slate max-w-none font-serif">
                        <Markdown>{affidavitDraft}</Markdown>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                        <FileText className="w-16 h-16 mb-4 text-slate-200" />
                        <p className="text-slate-500 font-medium">No draft generated yet.</p>
                        <p className="text-sm mt-2 max-w-xs">Select the relevant events from the left panel and click "Generate Draft" to have the AI format them into a formal legal document.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'ACCESS' && isAdmin && (
              <motion.div
                key="access"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 flex flex-col gap-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-blue-600" /> Access Management
                  </h2>
                  <p className="text-slate-600">Authorize your lawyer or other parties to view your case files.</p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-900 mb-2">How Sharing Works</h3>
                  <p className="text-sm text-blue-800">
                    By default, only you (the owner) can see these files. If you want to share this app with your lawyer, 
                    add their Google Account email address below. When they log in, they will be able to view and download 
                    all documents, timeline events, and correspondence.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <form onSubmit={handleAddAuthorizedEmail} className="flex gap-3 mb-8">
                    <input
                      type="email"
                      required
                      placeholder="lawyer@example.com"
                      value={newAuthEmail}
                      onChange={(e) => setNewAuthEmail(e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isAddingAuthEmail || !newAuthEmail}
                      className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isAddingAuthEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Authorize Email
                    </button>
                  </form>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">Currently Authorized Viewers</h3>
                    {authorizedEmails.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No external users have been authorized yet.</p>
                    ) : (
                      <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                        {authorizedEmails.map((authEmail) => (
                          <div key={authEmail.id} className="flex items-center justify-between p-4 bg-white">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">
                                {authEmail.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{authEmail.email}</p>
                                <p className="text-xs text-slate-500">Added on {authEmail.createdAt?.toDate().toLocaleDateString()}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveAuthorizedEmail(authEmail.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Revoke Access"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Document Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{previewDoc.name}</h3>
                    <p className="text-xs text-slate-500">{previewDoc.type} • {previewDoc.pages || 'Unknown'} pages</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-2">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    {isUploading ? 'Uploading...' : (previewDoc.fileUrl ? 'Update File' : 'Attach PDF')}
                    <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleAttachFile} disabled={isUploading} />
                  </label>
                  <a 
                    href={getDocUrl(previewDoc)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download={previewDoc.fileUrl ? undefined : `${previewDoc.name}.html`}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    {previewDoc.fileUrl ? 'Open in New Tab' : 'Download Preview'}
                  </a>
                  <button onClick={() => setPreviewDoc(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 flex overflow-hidden">
                {/* Document Viewer */}
                <div className="flex-1 bg-slate-100 p-4 relative border-r border-slate-200">
                  <iframe 
                    src={`${getDocUrl(previewDoc)}${previewDoc.fileUrl ? '#toolbar=0&navpanes=0&scrollbar=0' : ''}`} 
                    className="w-full h-full rounded-lg border border-slate-200 shadow-sm bg-white"
                    title="Document Preview"
                  />
                </div>

                {/* Gemini Analysis Panel */}
                <div className="w-96 bg-white flex flex-col shrink-0">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h4 className="font-bold flex items-center gap-2 text-slate-800">
                      <Sparkles className="w-4 h-4 text-purple-600"/> 
                      Gemini Analysis
                    </h4>
                    <button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing} 
                      className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {isAnalyzing && <Loader2 className="w-3 h-3 animate-spin" />}
                      {analysis ? 'Re-analyze' : 'Analyze'}
                    </button>
                  </div>
                  <div className="p-5 flex-1 overflow-y-auto">
                    {analysis ? (
                      <div className="prose prose-sm prose-slate max-w-none">
                        <Markdown>{analysis}</Markdown>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 px-4">
                        <Sparkles className="w-12 h-12 mb-4 text-slate-200" />
                        <p className="text-sm font-medium text-slate-500 mb-1">AI Document Analysis</p>
                        <p className="text-xs">Click analyze to generate insights, extract entities, and summarize key points using high-thinking mode.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showEmailScanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  Gmail Scan Results
                </h3>
                <button onClick={() => setShowEmailScanner(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Search Query:</span>
                <input 
                  type="text" 
                  value={emailScanQuery}
                  onChange={(e) => setEmailScanQuery(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={handleScanEmail}
                  disabled={isScanningEmail}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isScanningEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isScanningEmail ? 'Scanning...' : 'Rescan'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {scannedEmails.length === 0 && !isScanningEmail ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                    <Mail className="w-12 h-12 mb-3 text-slate-300" />
                    <p>No new emails found matching the query.</p>
                  </div>
                ) : (
                  scannedEmails.map(email => (
                    <div key={email.id} className="bg-white border border-slate-200 rounded-lg p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-900 truncate pr-4">{email.subject}</h4>
                          <span className="text-xs font-medium text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-1 rounded">{email.date}</span>
                        </div>
                        <p className="text-xs text-slate-600 mb-2 truncate">From: <span className="font-medium">{email.sender}</span></p>
                        <p className="text-sm text-slate-700 line-clamp-2 bg-slate-50 p-2 rounded border border-slate-100">{email.snippet}</p>
                      </div>
                      <button 
                        onClick={() => handleImportEmail(email)}
                        className="shrink-0 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors border border-blue-200"
                      >
                        Import
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-600" />
                  Upload & Process Documents
                </h3>
                <button onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFile(null);
                  setUploadName('');
                  setUploadDesc('');
                  setUploadError('');
                }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {uploadError}
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-2">
                  <h4 className="text-sm font-bold text-blue-800 mb-1">Secure Upload</h4>
                  <p className="text-xs text-blue-600 leading-relaxed">
                    Documents uploaded here are securely saved to your private Firestore database. 
                    They will automatically appear in the Document Vault and Master Timeline.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Document Name</label>
                  <input 
                    type="text" 
                    value={uploadName}
                    onChange={(e) => {
                      setUploadName(e.target.value);
                      setUploadError('');
                    }}
                    placeholder="e.g., Letter from Dr. Smith"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <label className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={useAIProcessing}
                    onChange={(e) => setUseAIProcessing(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-purple-900 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" /> AI Auto-Process
                    </span>
                    <span className="text-xs text-purple-700">Automatically summarize and extract timeline events from this document. (Supports PDF, Images, Text)</span>
                  </div>
                </label>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
                  <select 
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Evidence">Evidence</option>
                    <option value="Medical">Medical</option>
                    <option value="Correspondence">Correspondence</option>
                    <option value="Court Order">Court Order</option>
                    <option value="Client Notes">Client Notes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description / Summary</label>
                  <textarea 
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    placeholder="Brief summary of the document contents..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFile(null);
                  setUploadName('');
                  setUploadDesc('');
                  setUploadError('');
                  setAiProgress('');
                }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
                <button 
                  onClick={handleUpload} 
                  disabled={isUploading || !uploadName || !uploadFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  {isUploading ? 'Processing...' : 'Upload & Save'}
                </button>
              </div>
              {aiProgress && (
                <div className="px-4 pb-4 bg-slate-50 text-center">
                  <p className="text-sm text-purple-600 font-medium animate-pulse">{aiProgress}</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isClaimModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 shrink-0">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-blue-600" />
                  {editingClaimId ? 'Edit Claim & Rebuttal' : 'Add New Claim'}
                </h3>
                <button onClick={() => setIsClaimModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Claim Title</label>
                    <input 
                      type="text" 
                      value={claimForm.title}
                      onChange={(e) => setClaimForm({...claimForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Smashed mobile phone"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date of Alleged Incident</label>
                    <input 
                      type="text" 
                      value={claimForm.date}
                      onChange={(e) => setClaimForm({...claimForm, date: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 11 Jan 2024 or Historical"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Source Document</label>
                    <input 
                      type="text" 
                      value={claimForm.source}
                      onChange={(e) => setClaimForm({...claimForm, source: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Affidavit of Jessica (12.10.24)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Defense Status</label>
                    <select 
                      value={claimForm.status}
                      onChange={(e) => setClaimForm({...claimForm, status: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Needs Evidence">Needs Evidence</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Prepared">Prepared</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">The Claim / Allegation</label>
                  <textarea 
                    value={claimForm.description}
                    onChange={(e) => setClaimForm({...claimForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Describe what the other party is claiming..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Our Response / Rebuttal</label>
                  <textarea 
                    value={claimForm.response}
                    onChange={(e) => setClaimForm({...claimForm, response: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Draft the factual response or defense strategy here..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Link Evidence (Documents)</label>
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 p-2 space-y-1">
                      {documents.map(doc => (
                        <label key={doc.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer text-sm">
                          <input 
                            type="checkbox"
                            checked={claimForm.linkedEvidence.includes(doc.id) || claimForm.linkedEvidence.includes(doc.name)}
                            onChange={(e) => {
                              const newLinks = e.target.checked 
                                ? [...claimForm.linkedEvidence, doc.id]
                                : claimForm.linkedEvidence.filter(id => id !== doc.id && id !== doc.name);
                              setClaimForm({...claimForm, linkedEvidence: newLinks});
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="truncate text-slate-700">{doc.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Link Timeline Events</label>
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 p-2 space-y-1">
                      {timelineEvents.map(event => (
                        <label key={event.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer text-sm">
                          <input 
                            type="checkbox"
                            checked={claimForm.linkedEvents.includes(event.id)}
                            onChange={(e) => {
                              const newLinks = e.target.checked 
                                ? [...claimForm.linkedEvents, event.id]
                                : claimForm.linkedEvents.filter(id => id !== event.id);
                              setClaimForm({...claimForm, linkedEvents: newLinks});
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="truncate text-slate-700">{event.date}: {event.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button onClick={() => setIsClaimModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
                <button 
                  onClick={handleSaveClaim} 
                  disabled={!claimForm.title || !claimForm.description}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Save Claim
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
