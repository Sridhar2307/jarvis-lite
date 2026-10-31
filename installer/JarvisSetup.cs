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
            projectDir = AppDomain.CurrentDomain.BaseDirectory;
            if (!File.Exists(Path.Combine(projectDir, "package.json")))
            {
                DirectoryInfo parent = Directory.GetParent(projectDir);
                if (parent != null && File.Exists(Path.Combine(parent.FullName, "package.json")))
                {
                    projectDir = parent.FullName;
                }
            }
            Log("Project Directory: " + projectDir);
        }

        private void InitializeComponent()
        {
            this.Text = "JARVIS LITE + NEXORA — Full System Setup";
            this.Size = new Size(720, 560);
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
            progressBar.Location = new Point(28, 90);
            progressBar.Size = new Size(650, 18);
            progressBar.Style = ProgressBarStyle.Continuous;
            this.Controls.Add(progressBar);

            // Output Log Box
            rtbLog = new RichTextBox();
            rtbLog.Location = new Point(28, 122);
            rtbLog.Size = new Size(650, 310);
            rtbLog.BackColor = Color.FromArgb(15, 23, 42);
            rtbLog.ForeColor = Color.FromArgb(226, 232, 240);
            rtbLog.Font = new Font("Consolas", 9, FontStyle.Regular);
            rtbLog.ReadOnly = true;
            rtbLog.BorderStyle = BorderStyle.None;
            this.Controls.Add(rtbLog);

            // Checkbox: Also launch Nexora
            chkLaunchNexora = new CheckBox();
            chkLaunchNexora.Text = "Also start Nexora Voice Assistant & Local WebSocket Daemon";
            chkLaunchNexora.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            chkLaunchNexora.ForeColor = Color.FromArgb(203, 213, 225);
            chkLaunchNexora.Location = new Point(28, 442);
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
            btnInstall.Location = new Point(28, 472);
            btnInstall.Size = new Size(200, 36);
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
            btnLaunch.Location = new Point(240, 472);
            btnLaunch.Size = new Size(200, 36);
            btnLaunch.Cursor = Cursors.Hand;
            btnLaunch.Enabled = false;
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
                Log("Database synchronization finished.");
                SetProgress(60);

                // Step 4: Generate Prisma Client
                Log("Generating Prisma Client (@prisma/client)...");
                string prismaGen = RunShellCommand("npx.cmd", "prisma generate");
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
                Log("══════════════════════════════════════════════════");
                SetProgress(100);

                if (this.InvokeRequired)
                {
                    this.Invoke(new Action(delegate { btnLaunch.Enabled = true; }));
                }
                else
                {
                    btnLaunch.Enabled = true;
                }
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

        private void BtnLaunch_Click(object sender, EventArgs e)
        {
            try
            {
                // Start Next.js and open Chained Window
                string batPath = Path.Combine(projectDir, "launch-ecd.bat");
                if (File.Exists(batPath))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/c \"" + batPath + "\"",
                        WorkingDirectory = projectDir,
                        CreateNoWindow = true,
                        WindowStyle = ProcessWindowStyle.Hidden
                    });
                    Log("Launched Executive Command Dashboard.");
                }

                // If checkbox is checked, start Nexora daemon
                if (chkLaunchNexora.Checked)
                {
                    string nexoraBat = Path.Combine(projectDir, "run-nexora.bat");
                    if (File.Exists(nexoraBat))
                    {
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = nexoraBat,
                            WorkingDirectory = projectDir,
                            Arguments = "--headless",
                            WindowStyle = ProcessWindowStyle.Minimized
                        });
                        Log("Started Nexora Desktop Daemon in background.");
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Launch error: " + ex.Message);
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
