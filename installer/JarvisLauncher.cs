using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace Jarvis
{
    static class Launcher
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string projectDir = ResolveProjectDirectory();

                // 1. Check if Next.js port 3000 is listening
                if (!IsPortOpen("127.0.0.1", 3000))
                {
                    // Start Next.js dev server in background
                    ProcessStartInfo startInfo = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/c npm run dev",
                        WorkingDirectory = projectDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    Process.Start(startInfo);

                    // Wait up to 12 seconds for port 3000 to open
                    for (int i = 0; i < 24; i++)
                    {
                        Thread.Sleep(500);
                        if (IsPortOpen("127.0.0.1", 3000))
                            break;
                    }
                }

                // 2. Locate browser for standalone App Mode (Edge or Chrome)
                string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
                string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
                string browserPath = null;

                if (File.Exists(edgePath)) browserPath = edgePath;
                else if (File.Exists(chromePath)) browserPath = chromePath;

                if (browserPath != null)
                {
                    Process.Start(browserPath, "--app=\"http://localhost:3000\" --window-size=1360,860");
                }
                else
                {
                    Process.Start("http://localhost:3000");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Unable to launch JARVIS ECD:\n" + ex.Message, "JARVIS Launcher Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static string ResolveProjectDirectory()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            if (File.Exists(Path.Combine(baseDir, "package.json"))) return baseDir;

            DirectoryInfo curr = new DirectoryInfo(baseDir);
            while (curr != null && curr.Parent != null)
            {
                curr = curr.Parent;
                if (File.Exists(Path.Combine(curr.FullName, "package.json"))) return curr.FullName;
            }

            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string profileDocs = Path.Combine(userProfile, "Documents", "jarvis lite");
            if (File.Exists(Path.Combine(profileDocs, "package.json"))) return profileDocs;

            string myDocs = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            string docsLite = Path.Combine(myDocs, "jarvis lite");
            if (File.Exists(Path.Combine(docsLite, "package.json"))) return docsLite;

            string hardcoded = @"C:\Users\Sridhar's Nitro\Documents\jarvis lite";
            if (File.Exists(Path.Combine(hardcoded, "package.json"))) return hardcoded;

            return profileDocs;
        }

        static bool IsPortOpen(string host, int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    var result = client.BeginConnect(host, port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(400);
                    if (!success) return false;
                    client.EndConnect(result);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }
    }
}
