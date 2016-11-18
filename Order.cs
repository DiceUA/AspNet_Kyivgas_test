//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace aspnet_orders
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;

    public partial class Order
    {
        public System.Guid OrderId { get; set; }
        [Required(ErrorMessage = "Number required", AllowEmptyStrings = false)]
        public string Number { get; set; }
        public System.Guid ManagerId { get; set; }
        public System.DateTime Created_date { get; set; }
        public Nullable<System.DateTime> Updated_date { get; set; }
        public Nullable<System.DateTime> Delivery_date { get; set; }
        public string Description { get; set; }
    
        public virtual Manager Manager { get; set; }
    }
}