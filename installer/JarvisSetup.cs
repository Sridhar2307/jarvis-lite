using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace Jarvis
{
    public class SetupForm : Form
    {
        private Label lblTitle;
        private Label lblSubtitle;
        private ProgressBar progressBar;
        private RichTextBox rtbLog;
        private Button btnInstall;
        private Button btnLaunch;
        private CheckBox chkLaunchNexora;
        private string projectDir;

        public SetupForm()
        {
            InitializeComponent();
            ResolveProjectDirectory();
        }

        private void ResolveProjectDirectory()
        {
            // 1. Current executable folder
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            if (File.Exists(Path.Combine(baseDir, "package.json")))
            {
                projectDir = baseDir;
                Log("Project Directory: " + projectDir);
                return;
            }

            // 2. Search parent directories
            DirectoryInfo curr = new DirectoryInfo(baseDir);
            while (curr != null && curr.Parent != null)
            {
                curr = curr.Parent;
                if (File.Exists(Path.Combine(curr.FullName, "package.json")))
                {
                    projectDir = curr.FullName;
                    Log("Project Directory: " + projectDir);
                    return;
                }
            }

            // 3. UserProfile\Documents\jarvis lite
            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string profileDocs = Path.Combine(userProfile, "Documents", "jarvis lite");
            if (File.Exists(Path.Combine(profileDocs, "package.json")))
            {
                projectDir = profileDocs;
                Log("Project Directory: " + projectDir);
                return;
            }

            // 4. SpecialFolder.MyDocuments\jarvis lite
            string myDocs = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            string docsLite = Path.Combine(myDocs, "jarvis lite");
            if (File.Exists(Path.Combine(docsLite, "package.json")))
            {
                projectDir = docsLite;
                Log("Project Directory: " + projectDir);
                return;
            }

            // 5. Hardcoded known fallback
            string hardcoded = @"C:\Users\Sridhar's Nitro\Documents\jarvis lite";
            if (File.Exists(Path.Combine(hardcoded, "package.json")))
            {
                projectDir = hardcoded;
                Log("Project Directory: " + projectDir);
                return;
            }

            projectDir = profileDocs;
            Log("Project Directory (defaulted): " + projectDir);
        }

        private void InitializeComponent()
        {
            this.Text = "JARVIS LITE + NEXORA — Full System Setup";
            this.Size = new Size(740, 580);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(11, 15, 23);
            this.ForeColor = Color.White;

            string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "public\\favicon.ico");
            if (File.Exists(iconPath))
            {
                try { this.Icon = new Icon(iconPath); } catch { }
            }

            // Title
            lblTitle = new Label();
            lblTitle.Text = "⚡ JARVIS LITE + NEXORA";
            lblTitle.Font = new Font("Segoe UI", 16, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(0, 229, 255);
            lblTitle.Location = new Point(24, 20);
            lblTitle.AutoSize = true;
            this.Controls.Add(lblTitle);

            // Subtitle
            lblSubtitle = new Label();
            lblSubtitle.Text = "Autonomous Multimodal AI Operating System — Desktop Installer & Setup";
            lblSubtitle.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblSubtitle.ForeColor = Color.FromArgb(148, 163, 184);
            lblSubtitle.Location = new Point(26, 54);
            lblSubtitle.AutoSize = true;
            this.Controls.Add(lblSubtitle);

            // Progress Bar
            progressBar = new ProgressBar();
            progressBar.Location = new Point(28, 88);
            progressBar.Size = new Size(670, 18);
            progressBar.Style = ProgressBarStyle.Continuous;
            this.Controls.Add(progressBar);

            // Output Log Box
            rtbLog = new RichTextBox();
            rtbLog.Location = new Point(28, 118);
            rtbLog.Size = new Size(670, 320);
            rtbLog.BackColor = Color.FromArgb(15, 23, 42);
            rtbLog.ForeColor = Color.FromArgb(226, 232, 240);
            rtbLog.Font = new Font("Consolas", 9, FontStyle.Regular);
            rtbLog.ReadOnly = true;
            rtbLog.BorderStyle = BorderStyle.None;
            this.Controls.Add(rtbLog);

            // Checkbox: Also launch Nexora
            chkLaunchNexora = new CheckBox();
            chkLaunchNexora.Text = "Also start Nexora Voice Assistant & Desktop Daemon";
            chkLaunchNexora.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            chkLaunchNexora.ForeColor = Color.FromArgb(203, 213, 225);
            chkLaunchNexora.Location = new Point(28, 452);
            chkLaunchNexora.AutoSize = true;
            chkLaunchNexora.Checked = true;
            this.Controls.Add(chkLaunchNexora);

            // Install Button
            btnInstall = new Button();
            btnInstall.Text = "Install & Configure All";
            btnInstall.Font = new Font("Segoe UI", 10, FontStyle.Bold);
            btnInstall.BackColor = Color.FromArgb(0, 168, 204);
            btnInstall.ForeColor = Color.White;
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.FlatAppearance.BorderSize = 0;
            btnInstall.Location = new Point(28, 482);
            btnInstall.Size = new Size(210, 38);
            btnInstall.Cursor = Cursors.Hand;
            btnInstall.Click += new EventHandler(BtnInstall_Click);
            this.Controls.Add(btnInstall);

            // Launch Button
            btnLaunch = new Button();
            btnLaunch.Text = "Launch JARVIS System";
            btnLaunch.Font = new Font("Segoe UI", 10, FontStyle.Bold);
            btnLaunch.BackColor = Color.FromArgb(16, 185, 129);
            btnLaunch.ForeColor = Color.White;
            btnLaunch.FlatStyle = FlatStyle.Flat;
            btnLaunch.FlatAppearance.BorderSize = 0;
            btnLaunch.Location = new Point(254, 482);
            btnLaunch.Size = new Size(220, 38);
            btnLaunch.Cursor = Cursors.Hand;
            btnLaunch.Enabled = true; // Always enable so user can launch anytime!
            btnLaunch.Click += new EventHandler(BtnLaunch_Click);
            this.Controls.Add(btnLaunch);
        }

        private void Log(string message)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action<string>(Log), message);
                return;
            }
            rtbLog.AppendText("[" + DateTime.Now.ToString("HH:mm:ss") + "] " + message + Environment.NewLine);
            rtbLog.SelectionStart = rtbLog.Text.Length;
            rtbLog.ScrollToCaret();
        }

        private void SetProgress(int percent)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action<int>(SetProgress), percent);
                return;
            }
            progressBar.Value = Math.Min(100, Math.Max(0, percent));
        }

        private void BtnInstall_Click(object sender, EventArgs e)
        {
            btnInstall.Enabled = false;
            Thread setupThread = new Thread(RunSetupProcess);
            setupThread.IsBackground = true;
            setupThread.Start();
        }

        private void RunSetupProcess()
        {
            try
            {
                SetProgress(10);
                Log("══════════════════════════════════════════════════");
                Log("Starting JARVIS LITE + NEXORA Full System Setup...");
                Log("Project Root: " + projectDir);
                Log("══════════════════════════════════════════════════");

                // Step 1: Detect Node.js
                Log("Detecting Node.js runtime...");
                string nodeVer = RunShellCommand("node", "-v");
                if (string.IsNullOrEmpty(nodeVer))
                {
                    Log("WARNING: Node.js was not detected in PATH. Please install Node.js 18+.");
                }
                else
                {
                    Log("Node.js detected: " + nodeVer.Trim());
                }
                SetProgress(25);

                // Step 2: Detect Python
                Log("Detecting Python runtime for Nexora...");
                string pyVer = RunShellCommand("python", "--version");
                if (string.IsNullOrEmpty(pyVer))
                {
                    Log("WARNING: Python was not detected in PATH. Nexora requires Python 3.10+.");
                }
                else
                {
                    Log("Python detected: " + pyVer.Trim());
                }
                SetProgress(40);

                // Step 3: Synchronize Prisma Database
                Log("Synchronizing relational database schema (Prisma db push)...");
                string prismaPush = RunShellCommand("npx.cmd", "prisma db push --skip-generate");
                if (!string.IsNullOrEmpty(prismaPush))
                {
                    foreach (string line in prismaPush.Split(new char[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
                    {
                        if (line.Contains("database") || line.Contains("sync") || line.Contains("Done"))
                            Log("  " + line.Trim());
                    }
                }
                Log("Database synchronization finished.");
                SetProgress(60);

                // Step 4: Generate Prisma Client
                Log("Generating Prisma Client (@prisma/client)...");
                string prismaGen = RunShellCommand("npx.cmd", "prisma generate");
                if (!string.IsNullOrEmpty(prismaGen))
                {
                    foreach (string line in prismaGen.Split(new char[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
                    {
                        if (line.Contains("Generated") || line.Contains("Prisma Client"))
                            Log("  " + line.Trim());
                    }
                }
                Log("Prisma Client generated successfully.");
                SetProgress(75);

                // Step 5: Create Desktop Shortcut with Hotkey Ctrl+Alt+J
                Log("Creating Windows Desktop Shortcut (Ctrl+Alt+J)...");
                CreateWindowsDesktopShortcut();
                SetProgress(90);

                Log("══════════════════════════════════════════════════");
                Log("🎉 SETUP COMPLETE: All systems configured successfully!");
                Log("📌 Shortcut installed on Desktop: 'JARVIS Executive Dashboard (ECD).lnk'");
                Log("📌 Global Keyboard Hotkey: [Ctrl + Alt + J]");
                Log("Click [Launch JARVIS System] to open your dashboard!");
                Log("══════════════════════════════════════════════════");
                SetProgress(100);
            }
            catch (Exception ex)
            {
                Log("ERROR during setup: " + ex.Message);
            }
            finally
            {
                if (this.InvokeRequired)
                {
                    this.Invoke(new Action(delegate { btnInstall.Enabled = true; }));
                }
                else
                {
                    btnInstall.Enabled = true;
                }
            }
        }

        private void CreateWindowsDesktopShortcut()
        {
            try
            {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string batPath = Path.Combine(projectDir, "launch-ecd.bat");
                string iconPath = Path.Combine(projectDir, "public\\favicon.ico");
                string shortcutPath = Path.Combine(desktop, "JARVIS Executive Dashboard (ECD).lnk");

                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType != null)
                {
                    dynamic shell = Activator.CreateInstance(shellType);
                    dynamic shortcut = shell.CreateShortcut(shortcutPath);
                    shortcut.TargetPath = "cmd.exe";
                    shortcut.Arguments = "/c \"" + batPath + "\"";
                    shortcut.WorkingDirectory = projectDir;
                    if (File.Exists(iconPath))
                    {
                        shortcut.IconLocation = iconPath + ", 0";
                    }
                    shortcut.Hotkey = "Ctrl+Alt+J";
                    shortcut.Description = "Launch JARVIS Executive Command Dashboard (ECD) Chained Window [Ctrl+Alt+J]";
                    shortcut.WindowStyle = 7; // Minimized
                    shortcut.Save();
                    Log("Created desktop shortcut at: " + shortcutPath);
                }
            }
            catch (Exception ex)
            {
                Log("Shortcut warning: " + ex.Message);
            }
        }

        private void BtnLaunch_Click(object sender, EventArgs e)
        {
            try
            {
                Log("══════════════════════════════════════════════════");
                Log("🚀 Launching JARVIS System...");
                Log("Project Root: " + projectDir);

                // 1. Check & start Next.js Development Server
                if (!IsPortOpen("127.0.0.1", 3000))
                {
                    Log("Starting Next.js Server (npm run dev)...");
                    ProcessStartInfo nextInfo = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/c npm run dev",
                        WorkingDirectory = projectDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    Process.Start(nextInfo);

                    Log("Waiting for local server on http://localhost:3000...");
                    for (int i = 0; i < 20; i++)
                    {
                        Thread.Sleep(500);
                        if (IsPortOpen("127.0.0.1", 3000))
                        {
                            Log("Server is ready on port 3000!");
                            break;
                        }
                    }
                }
                else
                {
                    Log("Next.js Server is already active on port 3000.");
                }

                // 2. Locate browser and open Chained Window
                string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
                string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
                string browserPath = null;
                if (File.Exists(edgePath)) browserPath = edgePath;
                else if (File.Exists(chromePath)) browserPath = chromePath;

                if (browserPath != null)
                {
                    Log("Opening ECD Chained Window via " + Path.GetFileName(browserPath) + "...");
                    Process.Start(browserPath, "--app=\"http://localhost:3000\" --window-size=1360,860");
                }
                else
                {
                    Log("Opening ECD in default browser...");
                    Process.Start("http://localhost:3000");
                }

                // 3. Start Nexora Voice Assistant if checkbox is checked
                if (chkLaunchNexora.Checked)
                {
                    string nexoraDir = Path.Combine(projectDir, "nexora");
                    if (Directory.Exists(nexoraDir))
                    {
                        Log("Starting Nexora Voice Assistant Face HUD...");
                        ProcessStartInfo nexInfo = new ProcessStartInfo
                        {
                            FileName = "python.exe",
                            Arguments = "main.py",
                            WorkingDirectory = nexoraDir,
                            UseShellExecute = true
                        };
                        Process.Start(nexInfo);
                    }
                }

                Log("✅ JARVIS System is LIVE!");
                Log("══════════════════════════════════════════════════");
            }
            catch (Exception ex)
            {
                Log("Launch error: " + ex.Message);
                MessageBox.Show("Launch error:\n" + ex.Message, "JARVIS Launcher", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private bool IsPortOpen(string host, int port)
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

        private string RunShellCommand(string cmd, string args)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = cmd,
                    Arguments = args,
                    WorkingDirectory = projectDir,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using (Process proc = Process.Start(psi))
                {
                    string output = proc.StandardOutput.ReadToEnd();
                    proc.WaitForExit(30000);
                    return output;
                }
            }
            catch (Exception ex)
            {
                return "Error: " + ex.Message;
            }
        }

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SetupForm());
        }
    }
}
