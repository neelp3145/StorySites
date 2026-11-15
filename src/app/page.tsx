import { redirect } from "next/navigation";

export default function Home() {
  // Cursor Apps hosting sends X-Frame-Options: DENY / CSP frame-ancestors 'none',
  // so an iframe of /landing.html is blocked in the browser. Serve it as the document.
  redirect("/landing.html");
}
