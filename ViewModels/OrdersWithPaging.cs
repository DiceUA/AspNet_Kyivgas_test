using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace aspnet_orders.ViewModels
{
    public class OrdersWithPaging
    {
        public IEnumerable<dynamic> Orders { get; set; }
        public int TotalPage { get; set; }
    }
}