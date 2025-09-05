export default function TestPage() {
  return (
    <div style={{backgroundColor: 'red', color: 'white', minHeight: '100vh', textAlign: 'center', padding: '2rem'}}>
      <h1 style={{fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem'}}>TEST PAGE</h1>
      <p style={{fontSize: '1.5rem'}}>If you can see this page with red background and white text, then Tailwind is working.</p>
      <div style={{marginTop: '2rem'}}>
        <a href="/" style={{color: 'lightblue', textDecoration: 'underline'}}>Back to Homepage</a>
      </div>
    </div>
  );
}