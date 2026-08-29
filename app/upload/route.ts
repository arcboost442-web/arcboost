import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer], { type: file.type });

    const pinataForm = new FormData();
    pinataForm.append("file", blob, file.name);
    pinataForm.append("pinataMetadata", JSON.stringify({ name: file.name }));
    pinataForm.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: process.env.PINATA_API_KEY!,
        pinata_secret_api_key: process.env.PINATA_SECRET_KEY!,
      },
      body: pinataForm,
    });

    if (!res.ok) throw new Error("Pinata upload failed");
    
    const data = await res.json();
    const url = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
    
    return NextResponse.json({ url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}