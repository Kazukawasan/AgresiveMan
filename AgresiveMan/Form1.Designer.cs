namespace AgresiveMan
{
    partial class Form1
    {
        /// <summary>
        /// 必要なデザイナー変数です。
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// 使用中のリソースをすべてクリーンアップします。
        /// </summary>
        /// <param name="disposing">マネージ リソースを破棄する場合は true を指定し、その他の場合は false を指定します。</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows フォーム デザイナーで生成されたコード

        /// <summary>
        /// デザイナー サポートに必要なメソッドです。このメソッドの内容を
        /// コード エディターで変更しないでください。
        /// </summary>
        private void InitializeComponent()
        {
            this.button_Stress1 = new System.Windows.Forms.Button();
            this.button_Stop = new System.Windows.Forms.Button();
            this.button_Stress2 = new System.Windows.Forms.Button();
            this.button_Stress3 = new System.Windows.Forms.Button();
            this.button_Stress4 = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // button_Stress1
            // 
            this.button_Stress1.Location = new System.Drawing.Point(39, 71);
            this.button_Stress1.Name = "button_Stress1";
            this.button_Stress1.Size = new System.Drawing.Size(75, 23);
            this.button_Stress1.TabIndex = 0;
            this.button_Stress1.Text = "Thread 1";
            this.button_Stress1.UseVisualStyleBackColor = true;
            this.button_Stress1.Click += new System.EventHandler(this.button_Stres_Click);
            // 
            // button_Stop
            // 
            this.button_Stop.Location = new System.Drawing.Point(306, 201);
            this.button_Stop.Name = "button_Stop";
            this.button_Stop.Size = new System.Drawing.Size(75, 23);
            this.button_Stop.TabIndex = 1;
            this.button_Stop.Text = "Stop";
            this.button_Stop.UseVisualStyleBackColor = true;
            this.button_Stop.Click += new System.EventHandler(this.button_Stop_Click);
            // 
            // button_Stress2
            // 
            this.button_Stress2.Location = new System.Drawing.Point(39, 100);
            this.button_Stress2.Name = "button_Stress2";
            this.button_Stress2.Size = new System.Drawing.Size(75, 23);
            this.button_Stress2.TabIndex = 2;
            this.button_Stress2.Text = "Thread 2";
            this.button_Stress2.UseVisualStyleBackColor = true;
            this.button_Stress2.Click += new System.EventHandler(this.button_Stress2_Click);
            // 
            // button_Stress3
            // 
            this.button_Stress3.Location = new System.Drawing.Point(39, 129);
            this.button_Stress3.Name = "button_Stress3";
            this.button_Stress3.Size = new System.Drawing.Size(75, 23);
            this.button_Stress3.TabIndex = 3;
            this.button_Stress3.Text = "Thread 3";
            this.button_Stress3.UseVisualStyleBackColor = true;
            this.button_Stress3.Click += new System.EventHandler(this.button_Stress3_Click);
            // 
            // button_Stress4
            // 
            this.button_Stress4.Location = new System.Drawing.Point(39, 158);
            this.button_Stress4.Name = "button_Stress4";
            this.button_Stress4.Size = new System.Drawing.Size(75, 23);
            this.button_Stress4.TabIndex = 4;
            this.button_Stress4.Text = "Thread 4";
            this.button_Stress4.UseVisualStyleBackColor = true;
            this.button_Stress4.Click += new System.EventHandler(this.button_Stress4_Click);
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(410, 253);
            this.Controls.Add(this.button_Stress4);
            this.Controls.Add(this.button_Stress3);
            this.Controls.Add(this.button_Stress2);
            this.Controls.Add(this.button_Stop);
            this.Controls.Add(this.button_Stress1);
            this.Name = "Form1";
            this.Text = "Form1";
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Button button_Stress1;
        private System.Windows.Forms.Button button_Stop;
        private System.Windows.Forms.Button button_Stress2;
        private System.Windows.Forms.Button button_Stress3;
        private System.Windows.Forms.Button button_Stress4;
    }
}

