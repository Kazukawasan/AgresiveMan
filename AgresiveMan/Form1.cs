using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AgresiveMan
{
    public partial class Form1 : Form
    {
        bool StopStress = false;

        public Form1()
        {
            InitializeComponent();
        }

        private void button_Stres_Click(object sender, EventArgs e)
        {
            Task1();
        }

        private async void Task1()
        {
            await Task.Run(() =>
            {
                Calc();
            });
        }

        private void Calc()
        {
            StopStress = false;

            double dbrSinX = 0;
            double dbrSinY = 0;
            var intLoopCnt = 0;
            var intLoopMax = 1000000;

            do
            {
                for (intLoopCnt = 0; intLoopCnt < intLoopMax; intLoopCnt++)
                {
                    dbrSinX = 0.000001;
                    dbrSinY = Math.Sin(dbrSinX);
                    dbrSinY = dbrSinY + 0.00001;
                }
            }
            while ((StopStress == false));
        }

        private void CalcPrimNumber()
        {
            int i = 0;
            while (true)
            {
                i++;
            }
        }

        private async void button_Stress2_Click(object sender, EventArgs e)
        {
            await Task.Run(() =>
            {
                Calc();
            });
        }

        private void button_Stop_Click(object sender, EventArgs e)
        {
            StopStress = true;
        }

        private async void button_Stress3_Click(object sender, EventArgs e)
        {
            await Task.Run(() =>
            {
                Calc();
            });
        }

        private async void button_Stress4_Click(object sender, EventArgs e)
        {
            await Task.Run(() =>
            {
                Calc();
            });
        }

        bool is_prime(int a)
        {
            if (a <= 1)
                return false;

            if (a == 2)
                return true;

            if (a % 2 == 0)
                return false;

            for (int i = 3; i <= Math.Sqrt(a); i += 2)
            {
                if (a % i == 0)
                    return false;
            }

            return true;
        }
    }
}
