import { google } from "googleapis";

// Google Drive 인증 클라이언트
function getCredentials() {
  // 방법 1: base64 인코딩된 서비스 계정 키 (Vercel 환경)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64) {
    const json = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64, "base64").toString("utf-8");
    return JSON.parse(json);
  }
  // 방법 2: 개별 환경변수 (로컬 환경)
  return {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return auth;
}

// Drive API 인스턴스
function getDrive() {
  const auth = getAuthClient();
  return google.drive({ version: "v3", auth });
}

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!;

// 폴더명 생성 (세미나/일정 공통)
export function getDriveFolderName(date: string, title: string, prefix?: string): string {
  const dateStr = new Date(date).toISOString().slice(0, 10);
  const safeTitle = title.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 50);
  return prefix ? `[${prefix}]${dateStr}_${safeTitle}` : `${dateStr}_${safeTitle}`;
}

// 세미나용 폴더명 (하위 호환)
export function getSeminarFolderName(date: string, title: string): string {
  return getDriveFolderName(date, title);
}

// 폴더 생성
export async function createDriveFolder(folderName: string, parentId?: string): Promise<string> {
  const drive = getDrive();
  const res = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId || ROOT_FOLDER_ID],
    },
    fields: "id",
  });
  return res.data.id!;
}

// 폴더 내 파일 목록 조회
export async function listFolderFiles(folderId: string) {
  const drive = getDrive();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink)",
    orderBy: "modifiedTime desc",
  });
  return (res.data.files || []).map((f) => ({
    driveFileId: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
    size: f.size ? parseInt(f.size) : 0,
    modifiedTime: f.modifiedTime!,
    webViewLink: f.webViewLink || "",
    webContentLink: f.webContentLink || "",
  }));
}

// 루트 폴더 내 모든 세미나 폴더 조회
export async function listSeminarFolders() {
  const drive = getDrive();
  const res = await drive.files.list({
    q: `'${ROOT_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    orderBy: "name",
  });
  return res.data.files || [];
}

// 파일 다운로드 (스트림 반환)
export async function downloadDriveFile(fileId: string) {
  const drive = getDrive();
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );
  return res;
}

// 파일 메타데이터 조회
export async function getDriveFileMetadata(fileId: string) {
  const drive = getDrive();
  const res = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, size, modifiedTime, webViewLink, webContentLink",
  });
  return res.data;
}

// 폴더 존재 여부 확인 (이름으로)
export async function findFolderByName(folderName: string): Promise<string | null> {
  const drive = getDrive();
  const res = await drive.files.list({
    q: `'${ROOT_FOLDER_ID}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
  });
  return res.data.files?.[0]?.id || null;
}
