export const runtime = "edge";

export async function GET() {
  try {
    await fetch("https://canh-duc-digital-form.onrender.com/health");
    return new Response("ok");
  } catch {
    return new Response("error", { status: 500 });
  }
}
