'use client';
import { useEffect, useRef, useState } from 'react';
import { blankEducationCourseDraftInput, courseDraftFromInput, editEducationCourseDraft, educationCourseStorageKey, persistEducationCourseDraft, projectLessonsForLearnerPreview, reorderLessonInputs, restoreEducationCourseDraft, type EducationCourseDraftInput } from '../../../lib/local-education-course';
import { generateCourse, importCourse } from '../../../lib/course-creator';

const profileId = 'course-creator-sandbox';
export default function CourseCreatorPage() {
  const [input, setInput] = useState<EducationCourseDraftInput>(blankEducationCourseDraftInput);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState('');
  const [brief, setBrief] = useState('');
  const [preview, setPreview] = useState(false);
  const [transfer, setTransfer] = useState('');
  const raw = useRef<string | null>(null);
  const id = useRef('');
  useEffect(() => {
    try {
      raw.current = localStorage.getItem(educationCourseStorageKey(profileId));
      const saved = restoreEducationCourseDraft(raw.current, profileId);
      id.current = saved?.id ?? crypto.randomUUID();
      if (saved) setInput(editEducationCourseDraft(saved));
    } catch { setBlocked(true); setMessage('Saved draft cannot be read. Nothing was overwritten. Restore access or repair the saved data before saving.'); }
    setReady(true);
  }, []);
  function attempt(action: () => void) { try { action(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to complete action. Your draft remains in the editor.'); } }
  function lesson(index: number, key: 'title' | 'content' | 'durationMinutes', value: string) {
    setPreview(false); setInput(current => ({...current, lessons: current.lessons.map((item, i) => i === index ? {...item, [key]: value} : item)}));
  }
  return <main><h1>Course Creator — interactive test workspace</h1>
    <p>Manual authoring, learner preview and JSON export. Drafts persist in this browser only, in an isolated sandbox profile. No publishing or account storage.</p>
    <p role="status">{message}</p>
    <fieldset disabled={!ready}><legend>Course details</legend>
      <label>Course title<input maxLength={160} value={input.title} onChange={e => {setPreview(false); setInput({...input, title:e.target.value});}} /></label>
      <label>Summary<textarea aria-label="Summary" maxLength={2000} value={input.summary} onChange={e => {setPreview(false); setInput({...input, summary:e.target.value});}} /></label>
      {input.lessons.map((item,index) => <fieldset key={item.id}><legend>Lesson {index+1}</legend>
        <label>Lesson title<input maxLength={160} value={item.title} onChange={e => lesson(index,'title',e.target.value)} /></label>
        <label>Lesson content<textarea aria-label="Lesson content" maxLength={20000} value={item.content} onChange={e => lesson(index,'content',e.target.value)} /></label>
        <label>Duration in minutes<input type="number" min={1} max={600} value={item.durationMinutes} onChange={e => lesson(index,'durationMinutes',e.target.value)} /></label>
        <button disabled={index===0} onClick={() => {setPreview(false);setInput({...input,lessons:reorderLessonInputs(input.lessons,index,-1)});}}>Move up</button>
        <button disabled={index===input.lessons.length-1} onClick={() => {setPreview(false);setInput({...input,lessons:reorderLessonInputs(input.lessons,index,1)});}}>Move down</button>
        <button onClick={() => {if(window.confirm('Remove this lesson from the unsaved draft?')) {setPreview(false);setInput({...input,lessons:input.lessons.filter((_,i)=>i!==index)});}}}>Remove lesson</button>
      </fieldset>)}
      <button disabled={input.lessons.length>=50} onClick={() => {setPreview(false);setInput({...input,lessons:[...input.lessons,{id:crypto.randomUUID(),title:'',content:'',durationMinutes:''}]});}}>Add lesson</button>
      <button disabled={blocked} onClick={() => attempt(() => {const draft=courseDraftFromInput(input,{id:id.current,profileId}); raw.current=persistEducationCourseDraft(localStorage,profileId,raw.current,draft);setMessage('Course saved in this browser. Reload to verify persistence.');})}>Save course</button>
      <button onClick={() => attempt(() => {courseDraftFromInput(input,{id:id.current,profileId});setPreview(true);setMessage('Preview of current unsaved editor content.');})}>Preview course</button>
      <button onClick={() => attempt(() => {setTransfer(JSON.stringify(courseDraftFromInput(input,{id:id.current,profileId}),null,2));setMessage('Validated export ready to copy.');})}>Export JSON</button>
    </fieldset>
    {preview && <section aria-label="Learner preview"><h2>{input.title}</h2><p>{input.summary}</p>{projectLessonsForLearnerPreview(courseDraftFromInput(input,{id:id.current,profileId})).map(item => <article key={item.id}><h3>{item.title}</h3><p style={{whiteSpace:'pre-wrap'}}>{item.content}</p>{item.durationMinutes && <p>{item.durationMinutes} minutes</p>}</article>)}</section>}
    <label>Course JSON export / import<textarea aria-label="Course JSON export / import" value={transfer} onChange={e=>setTransfer(e.target.value)} /></label>
    <button disabled={!ready || blocked} onClick={()=>attempt(()=>{const imported=importCourse(transfer,profileId);if(window.confirm('Replace unsaved editor content with this import?')){setInput(imported);setPreview(false);setMessage('Imported into editor only. Review and save to persist.');}})}>Import JSON</button>
    <section><h2>AI generation adapter</h2><p>No AI provider is connected. This control reports the configuration blocker honestly; it does not fabricate a course.</p><label>Course brief<textarea aria-label="Course brief" maxLength={4000} value={brief} onChange={e=>setBrief(e.target.value)} /></label><button onClick={async()=>{try{await generateCourse(brief);}catch(error){setMessage(error instanceof Error?error.message:'Generation failed.');}}}>Check generation availability</button></section>
  </main>;
}
