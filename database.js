import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Update Bitly Settings in database
 */
export async function updateBitlySettings(payload, logger) {
  const updateUser = await prisma.user
    .update({
      where: {
        login: payload.username,
      },
      data: {
        updated_at: new Date(),
        bitly_settings: {
          upsert: {
            create: {
              use_value: payload.settings.use_value,
              label: payload.settings.label,
              aria_label: payload.settings.aria_label,
              tooltip: payload.settings.tooltip,
              error: payload.settings.error,
              bitly_token: payload.settings.bitly_token,
              bitly_domain: payload.settings.bitly_domain,
              bitly_addr: payload.settings.bitly_addr,
              bitly_enabled: payload.settings.bitly_enabled,
              type: payload.settings.type,
              updated_at: new Date(),
            },
            update: {
              use_value: payload.settings.use_value,
              label: payload.settings.label,
              aria_label: payload.settings.aria_label,
              tooltip: payload.settings.tooltip,
              error: payload.settings.error,
              bitly_token: payload.settings.bitly_token,
              bitly_domain: payload.settings.bitly_domain,
              bitly_addr: payload.settings.bitly_addr,
              bitly_enabled: payload.settings.bitly_enabled,
              type: payload.settings.type,
              updated_at: new Date(),
            },
          },
          update: {
            use_value: payload.settings.use_value,
            label: payload.settings.label,
            aria_label: payload.settings.aria_label,
            tooltip: payload.settings.tooltip,
            error: payload.settings.error,
            bitly_token: payload.settings.bitly_token,
            bitly_domain: payload.settings.bitly_domain,
            bitly_addr: payload.settings.bitly_addr,
            bitly_enabled: payload.settings.bitly_enabled,
            type: payload.settings.type,
            updated_at: new Date(),
          },
        },
      },
      include: {
        bitly_settings: true,
      },
    })
    .then((user) => {
      return user;
    })
    .catch((error) => {
      logger.log("Error: ", error);
      return error;
    });
  return updateUser;
}
/**
 * Update Main Settings in database
 * @param {*} payload
 */
export async function updateMainSettings(payload, logger) {
  const updateUser = await prisma.user
    .update({
      where: {
        login: payload.username,
      },
      data: {
        updated_at: new Date(),
        main_settings: {
          upsert: {
            create: {
              brand_image: payload.settings.brand_image,
              brand_height: payload.settings.brand_height,
              brand_width: payload.settings.brand_width,
              brand_opacity: payload.settings.brand_opacity,
              form_type: payload.settings.form_type,
              dark: payload.settings.dark,
            },
            update: {
              brand_image: payload.settings.brand_image,
              brand_height: payload.settings.brand_height,
              brand_width: payload.settings.brand_width,
              brand_opacity: payload.settings.brand_opacity,
              form_type: payload.settings.form_type,
              dark: payload.settings.dark,
            },
          },
          update: {
            brand_image: payload.settings.brand_image,
            brand_height: payload.settings.brand_height,
            brand_width: payload.settings.brand_width,
            brand_opacity: payload.settings.brand_opacity,
            form_type: payload.settings.form_type,
            dark: payload.settings.dark,
          },
        },
      },
      include: {
        main_settings: true,
      },
    })
    .then((user) => {
      return user;
    })
    .catch((error) => {
      logger.log("Error: ", error);
      return error;
    });
  return updateUser;
}

/**
 * Update User Settings in database
 * @param {*} payload
 */
export async function updateUserSettings(payload, logger) {
  const updateUser = await prisma.user
    .update({
      where: {
        login: payload.username,
      },
      data: {
        first_name: payload.settings.first_name,
        last_name: payload.settings.last_name,
        organization: payload.settings.organization,
        address: payload.settings.address,
        city: payload.settings.city,
        state: payload.settings.state,
        zip: payload.settings.zip,
        email: payload.settings.email,
        updated_at: new Date(),
        active: payload.settings.active,
        confirmed: payload.settings.confirmed,
        confirmation_code: payload.settings.confirmation_code,
        userfront_id: payload.settings.userfront_id,
        stripe_id: payload.settings.stripe_id,
      },
    })
    .then((user) => {
      return user;
    })
    .catch((error) => {
      logger.log("Error: ", error);
      return error;
    });
  return updateUser;
}
/**
 * Update UTM Settings in database
 * @param {*} payload
 */
export async function updateUTMSettings(payload, logger) {
  const updateUser = await prisma.user
    .update({
      where: {
        login: payload.username,
      },
      data: {
        updated_at: new Date(),
        utm_target: {
          upsert: {
            create: {
              use_value: payload.settings.utm_target.use_value,
              is_chooser: payload.settings.utm_target.is_chooser,
              show_name: payload.settings.utm_target.show_name,
              label: payload.settings.utm_target.label,
              tooltip: payload.settings.utm_target.tooltip,
              error: payload.settings.utm_target.error,
              aria_label: payload.settings.utm_target.aria_label,
              value: payload.settings.utm_target.value,
            },
            update: {
              use_value: payload.settings.utm_target.use_value,
              is_chooser: payload.settings.utm_target.is_chooser,
              show_name: payload.settings.utm_target.show_name,
              label: payload.settings.utm_target.label,
              tooltip: payload.settings.utm_target.tooltip,
              error: payload.settings.utm_target.error,
              aria_label: payload.settings.utm_target.aria_label,
              value: payload.settings.utm_target.value,
            },
          },
          update: {
            use_value: payload.settings.utm_target.use_value,
            is_chooser: payload.settings.utm_target.is_chooser,
            show_name: payload.settings.utm_target.show_name,
            label: payload.settings.utm_target.label,
            tooltip: payload.settings.utm_target.tooltip,
            error: payload.settings.utm_target.error,
            aria_label: payload.settings.utm_target.aria_label,
            value: payload.settings.utm_target.value,
          },
        },
        utm_keyword: {
          upsert: {
            create: {
              use_value: payload.settings.utm_keyword.use_value,
              is_chooser: payload.settings.utm_keyword.is_chooser,
              show_name: payload.settings.utm_keyword.show_name,
              label: payload.settings.utm_keyword.label,
              tooltip: payload.settings.utm_keyword.tooltip,
              error: payload.settings.utm_keyword.error,
              aria_label: payload.settings.utm_keyword.aria_label,
              value: payload.settings.utm_keyword.value,
            },
            update: {
              use_value: payload.settings.utm_keyword.use_value,
              is_chooser: payload.settings.utm_keyword.is_chooser,
              show_name: payload.settings.utm_keyword.show_name,
              label: payload.settings.utm_keyword.label,
              tooltip: payload.settings.utm_keyword.tooltip,
              error: payload.settings.utm_keyword.error,
              aria_label: payload.settings.utm_keyword.aria_label,
              value: payload.settings.utm_keyword.value,
            },
          },
          update: {
            use_value: payload.settings.utm_keyword.use_value,
            is_chooser: payload.settings.utm_keyword.is_chooser,
            show_name: payload.settings.utm_keyword.show_name,
            label: payload.settings.utm_keyword.label,
            tooltip: payload.settings.utm_keyword.tooltip,
            error: payload.settings.utm_keyword.error,
            aria_label: payload.settings.utm_keyword.aria_label,
            value: payload.settings.utm_keyword.value,
          },
        },
        utm_content: {
          upsert: {
            create: {
              use_value: payload.settings.utm_content.use_value,
              is_chooser: payload.settings.utm_content.is_chooser,
              show_name: payload.settings.utm_content.show_name,
              label: payload.settings.utm_content.label,
              tooltip: payload.settings.utm_content.tooltip,
              error: payload.settings.utm_content.error,
              aria_label: payload.settings.utm_content.aria_label,
              value: payload.settings.utm_content.value,
            },
            update: {
              use_value: payload.settings.utm_content.use_value,
              is_chooser: payload.settings.utm_content.is_chooser,
              show_name: payload.settings.utm_content.show_name,
              label: payload.settings.utm_content.label,
              tooltip: payload.settings.utm_content.tooltip,
              error: payload.settings.utm_content.error,
              aria_label: payload.settings.utm_content.aria_label,
              value: payload.settings.utm_content.value,
            },
          },
          update: {
            use_value: payload.settings.utm_content.use_value,
            is_chooser: payload.settings.utm_content.is_chooser,
            show_name: payload.settings.utm_content.show_name,
            label: payload.settings.utm_content.label,
            tooltip: payload.settings.utm_content.tooltip,
            error: payload.settings.utm_content.error,
            aria_label: payload.settings.utm_content.aria_label,
            value: payload.settings.utm_content.value,
          },
        },
        utm_medium: {
          upsert: {
            create: {
              use_value: payload.settings.utm_medium.use_value,
              is_chooser: payload.settings.utm_medium.is_chooser,
              show_name: payload.settings.utm_medium.show_name,
              label: payload.settings.utm_medium.label,
              tooltip: payload.settings.utm_medium.tooltip,
              error: payload.settings.utm_medium.error,
              aria_label: payload.settings.utm_medium.aria_label,
              value: payload.settings.utm_medium.value,
            },
            update: {
              use_value: payload.settings.utm_medium.use_value,
              is_chooser: payload.settings.utm_medium.is_chooser,
              show_name: payload.settings.utm_medium.show_name,
              label: payload.settings.utm_medium.label,
              tooltip: payload.settings.utm_medium.tooltip,
              error: payload.settings.utm_medium.error,
              aria_label: payload.settings.utm_medium.aria_label,
              value: payload.settings.utm_medium.value,
            },
          },
          update: {
            use_value: payload.settings.utm_medium.use_value,
            is_chooser: payload.settings.utm_medium.is_chooser,
            show_name: payload.settings.utm_medium.show_name,
            label: payload.settings.utm_medium.label,
            tooltip: payload.settings.utm_medium.tooltip,
            error: payload.settings.utm_medium.error,
            aria_label: payload.settings.utm_medium.aria_label,
            value: payload.settings.utm_medium.value,
          },
        },
        utm_source: {
          upsert: {
            create: {
              use_value: payload.settings.utm_source.use_value,
              is_chooser: payload.settings.utm_source.is_chooser,
              show_name: payload.settings.utm_source.show_name,
              label: payload.settings.utm_source.label,
              tooltip: payload.settings.utm_source.tooltip,
              error: payload.settings.utm_source.error,
              aria_label: payload.settings.utm_source.aria_label,
              value: payload.settings.utm_source.value,
            },
            update: {
              use_value: payload.settings.utm_source.use_value,
              is_chooser: payload.settings.utm_source.is_chooser,
              show_name: payload.settings.utm_source.show_name,
              label: payload.settings.utm_source.label,
              tooltip: payload.settings.utm_source.tooltip,
              error: payload.settings.utm_source.error,
              aria_label: payload.settings.utm_source.aria_label,
              value: payload.settings.utm_source.value,
            },
          },
          update: {
            use_value: payload.settings.utm_source.use_value,
            is_chooser: payload.settings.utm_source.is_chooser,
            show_name: payload.settings.utm_source.show_name,
            label: payload.settings.utm_source.label,
            tooltip: payload.settings.utm_source.tooltip,
            error: payload.settings.utm_source.error,
            aria_label: payload.settings.utm_source.aria_label,
            value: payload.settings.utm_source.value,
          },
        },
        utm_term: {
          upsert: {
            create: {
              use_value: payload.settings.utm_term.use_value,
              is_chooser: payload.settings.utm_term.is_chooser,
              show_name: payload.settings.utm_term.show_name,
              label: payload.settings.utm_term.label,
              tooltip: payload.settings.utm_term.tooltip,
              error: payload.settings.utm_term.error,
              aria_label: payload.settings.utm_term.aria_label,
              value: payload.settings.utm_term.value,
            },
            update: {
              use_value: payload.settings.utm_term.use_value,
              is_chooser: payload.settings.utm_term.is_chooser,
              show_name: payload.settings.utm_term.show_name,
              label: payload.settings.utm_term.label,
              tooltip: payload.settings.utm_term.tooltip,
              error: payload.settings.utm_term.error,
              aria_label: payload.settings.utm_term.aria_label,
              value: payload.settings.utm_term.value,
            },
          },
          update: {
            use_value: payload.settings.utm_term.use_value,
            is_chooser: payload.settings.utm_term.is_chooser,
            show_name: payload.settings.utm_term.show_name,
            label: payload.settings.utm_term.label,
            tooltip: payload.settings.utm_term.tooltip,
            error: payload.settings.utm_term.error,
            aria_label: payload.settings.utm_term.aria_label,
            value: payload.settings.utm_term.value,
          },
        },
        utm_campaign: {
          upsert: {
            create: {
              use_value: payload.settings.utm_campaign.use_value,
              is_chooser: payload.settings.utm_campaign.is_chooser,
              show_name: payload.settings.utm_campaign.show_name,
              label: payload.settings.utm_campaign.label,
              tooltip: payload.settings.utm_campaign.tooltip,
              error: payload.settings.utm_campaign.error,
              aria_label: payload.settings.utm_campaign.aria_label,
              value: payload.settings.utm_campaign.value,
            },
            update: {
              use_value: payload.settings.utm_campaign.use_value,
              is_chooser: payload.settings.utm_campaign.is_chooser,
              show_name: payload.settings.utm_campaign.show_name,
              label: payload.settings.utm_campaign.label,
              tooltip: payload.settings.utm_campaign.tooltip,
              error: payload.settings.utm_campaign.error,
              aria_label: payload.settings.utm_campaign.aria_label,
              value: payload.settings.utm_campaign.value,
            },
          },
          update: {
            use_value: payload.settings.utm_campaign.use_value,
            is_chooser: payload.settings.utm_campaign.is_chooser,
            show_name: payload.settings.utm_campaign.show_name,
            label: payload.settings.utm_campaign.label,
            tooltip: payload.settings.utm_campaign.tooltip,
            error: payload.settings.utm_campaign.error,
            aria_label: payload.settings.utm_campaign.aria_label,
            value: payload.settings.utm_campaign.value,
          },
        },
      },
      include: {
        utm_target: true,
        utm_keyword: true,
        utm_content: true,
        utm_medium: true,
        utm_source: true,
        utm_term: true,
        utm_campaign: true,
      },
    })
    .then((user) => {
      return user;
    })
    .catch((error) => {
      logger.log("Error: ", error);
      return error;
    });
  return updateUser;
}

/**
 * Update QR Settings in database
 */
export async function updateQRSettings(payload, logger) {
  const updateUser = await prisma.user
    .update({
      where: {
        login: payload.username,
      },
      data: {
        updated_at: new Date(),
        qr_settings: {
          upsert: {
            create: {
              value: payload.settings.value,
              ec_level: payload.settings.ec_level,
              enable_CORS: payload.settings.enable_CORS,
              size: payload.settings.size,
              quiet_zone: payload.settings.quiet_zone,
              bg_color: payload.settings.bg_color,
              fg_color: payload.settings.fg_color,
              logo_image: payload.settings.logo_image,
              logo_width: payload.settings.logo_width,
              logo_height: payload.settings.logo_height,
              logo_opacity: payload.settings.logo_opacity,
              remove_qr_code_behind_logo:
                payload.settings.remove_qr_code_behind_logo,
              logo_padding: payload.settings.logo_padding,
              logo_padding_style: payload.settings.logo_padding_style,
              top_l_eye_radius: payload.settings.top_l_eye_radius,
              top_r_eye_radius: payload.settings.top_r_eye_radius,
              bottom_l_eye_radius: payload.settings.bottom_l_eye_radius,
              eye_color: payload.settings.eye_color,
              qr_style: payload.settings.qr_style,
              qr_type: payload.settings.qr_type,
              x_parent: payload.settings.x_parent,
            },
            update: {
              value: payload.settings.value,
              ec_level: payload.settings.ec_level,
              enable_CORS: payload.settings.enable_CORS,
              size: payload.settings.size,
              quiet_zone: payload.settings.quiet_zone,
              bg_color: payload.settings.bg_color,
              fg_color: payload.settings.fg_color,
              logo_image: payload.settings.logo_image,
              logo_width: payload.settings.logo_width,
              logo_height: payload.settings.logo_height,
              logo_opacity: payload.settings.logo_opacity,
              remove_qr_code_behind_logo:
                payload.settings.remove_qr_code_behind_logo,
              logo_padding: payload.settings.logo_padding,
              logo_padding_style: payload.settings.logo_padding_style,
              top_l_eye_radius: payload.settings.top_l_eye_radius,
              top_r_eye_radius: payload.settings.top_r_eye_radius,
              bottom_l_eye_radius: payload.settings.bottom_l_eye_radius,
              eye_color: payload.settings.eye_color,
              qr_style: payload.settings.qr_style,
              qr_type: payload.settings.qr_type,
              x_parent: payload.settings.x_parent,
            },
          },
          update: {
            value: payload.settings.value,
            ec_level: payload.settings.ec_level,
            enable_CORS: payload.settings.enable_CORS,
            size: payload.settings.size,
            quiet_zone: payload.settings.quiet_zone,
            bg_color: payload.settings.bg_color,
            fg_color: payload.settings.fg_color,
            logo_image: payload.settings.logo_image,
            logo_width: payload.settings.logo_width,
            logo_height: payload.settings.logo_height,
            logo_opacity: payload.settings.logo_opacity,
            remove_qr_code_behind_logo:
              payload.settings.remove_qr_code_behind_logo,
            logo_padding: payload.settings.logo_padding,
            logo_padding_style: payload.settings.logo_padding_style,
            top_l_eye_radius: payload.settings.top_l_eye_radius,
            top_r_eye_radius: payload.settings.top_r_eye_radius,
            bottom_l_eye_radius: payload.settings.bottom_l_eye_radius,
            eye_color: payload.settings.eye_color,
            qr_style: payload.settings.qr_style,
            qr_type: payload.settings.qr_type,
            x_parent: payload.settings.x_parent,
          },
        },
      },
      include: {
        qr_settings: true,
      },
    })
    .then((user) => {
      return user;
    })
    .catch((error) => {
      logger.log("Error: ", error);
      return error;
    });
  return updateUser;
}

/**
 * update License settings in database
 */
export async function updateLicenseSettings(payload, logger) {
  const updateUser = await prisma.user
    .update({
      where: {
        login: payload.username,
      },
      data: {
        keygen_id: payload.settings.cust_id,
        updated_at: new Date(),
        licensing: {
          upsert: {
            create: {
              cust_id: payload.settings.cust_id,
              active: payload.settings.active,
              confirmed: payload.settings.confirmed,
              license_key: payload.settings.license_key,
              license_type: payload.settings.license_type,
              expire_date: payload.settings.expire_date,
              updated_at: payload.settings.updated_at,
              machines: payload.settings.machines,
            },
            update: {
              cust_id: payload.settings.cust_id,
              active: payload.settings.active,
              confirmed: payload.settings.confirmed,
              license_key: payload.settings.license_key,
              license_type: payload.settings.license_type,
              expire_date: payload.settings.expire_date,
              updated_at: payload.settings.updated_at,
              machines: payload.settings.machines,
            },
          },
          update: {
            cust_id: payload.settings.cust_id,
            active: payload.settings.active,
            confirmed: payload.settings.confirmed,
            license_key: payload.settings.license_key,
            license_type: payload.settings.license_type,
            expire_date: payload.settings.expire_date,
            updated_at: payload.settings.updated_at,
            machines: payload.settings.machines,
          },
        },
      },
      include: {
        licensing: true,
      },
    })
    .then((user) => {
      return user;
    })
    .catch((error) => {
      logger.log("Error: ", error);
      return error;
    });
  return updateUser;
}
/**
 *
 * @param {*} session
 */
export async function addUserToDatabase(session, logger) {
  const username = `${session.customer_details.name.toLowerCase().replace(" ", "_")}`;
  logger.log("Creating User", username, session.customer_details.name, session.stripe_id)
  const data = {
    login: username,
    stripe_id: session.stripe_id || "",
    first_name: session.customer_details.name.split(" ")[0],
    last_name: session.customer_details.name.split(" ")[1],
    organization: "",
    address: session.customer_details.address?.line1 || "",
    city: session.customer_details.address?.city || "",
    state: session.customer_details.address?.state || "",
    zip: session.customer_details.address?.postal_code || "",
    email: session.customer_details.email,
    userfront_id: session.userfront_id || "",
    active: true,
    confirmed: true,
    licensing: {
      create: {
        cust_id: "",
        active: false,
        confirmed: true,
        license_key: session.lic_key || "",
        license_type: session.prod_type || "free",
        expire_date: session.expire_date || new Date(),
      },
    },
    main_settings: {
      create: {
        brand_image: "",
        brand_height: 200,
        brand_width: 200,
        brand_opacity: 1.0,
        form_type: "simple",
        dark: false,
      },
    },
    bitly_settings: {
      create: {
        use_value: false,
        label: "Shorten Link",
        aria_label: "Shorten Link with Bitly",
        tooltip: "Shorten Link with Bitly",
        error: "No Bitly Token Found",
        bitly_token: "",
        bitly_domain: "",
        bitly_addr: "https://api-ssl.bitly.com/v4/shorten",
        bitly_enabled: false,
        type: "bitly",
      },
    },
    utm_campaign: {
      create: {
        use_value: true,
        is_chooser: false,
        show_name: true,
        label: "Campaign",
        tooltip: "Enter a campaign name",
        error: "Please enter a valid campaign name",
        aria_label: "Campaign Name",
        value: [],
      },
    },
    utm_keyword: {
      create: {
        use_value: true,
        is_chooser: false,
        show_name: true,
        label: "Keywords",
        tooltip: "Additional keywords to append to the link",
        error: "Please enter a valid Keyword",
        aria_label: "Add any additional keywords",
        value: [],
      },
    },
    utm_content: {
      create: {
        use_value: true,
        is_chooser: false,
        show_name: true,
        label: "Content",
        tooltip: "Additional content to append to the link",
        error: "Please enter a valid content value",
        aria_label: "Add any additional content",
        value: [],
      },
    },
    utm_medium: {
      create: {
        use_value: true,
        is_chooser: false,
        show_name: true,
        label: "Referral Medium",
        tooltip:
          "What kind of referral link is this? This is usually how you're distributing the link.",
        error: "Please choose a valid referral medium",
        aria_label: "Referral medium",
        value: [
          { key: "cpc", value: "Cost Per Click" },
          { key: "direct", value: "Direct" },
          { key: "display", value: "Display" },
          { key: "email", value: "Email" },
          { key: "event", value: "Event" },
          { key: "organic", value: "Organic" },
          { key: "paid-search", value: "Paid Search" },
          { key: "paid-social", value: "Paid Social" },
          { key: "qr", value: "QR Code" },
          { key: "referral", value: "Referral" },
          { key: "retargeting", value: "Retargeting" },
          { key: "social", value: "Social" },
          { key: "ppc", value: "Pay Per Click" },
          { key: "linq", value: "Linq" },
        ],
      },
    },
    utm_source: {
      create: {
        use_value: true,
        is_chooser: false,
        show_name: true,
        label: "Referral Source",
        tooltip: "Where will you be posting this link?",
        error: "Please enter a valid referral source",
        aria_label: "Referral Source",
        value: [],
      },
    },
    utm_target: {
      create: {
        use_value: true,
        is_chooser: false,
        show_name: true,
        label: "URL to encode",
        tooltip: "Complete URL to encode",
        error: "Please enter a valid URL",
        aria_label: "This must be a valid URL",
        value: [],
      },
    },
    utm_term: {
      create: {
        use_value: true,
        is_chooser: false,
        show_name: true,
        label: "Referral Term",
        tooltip: "Enter a referral term",
        error: "Please enter a valid referral term",
        aria_label: "Referral Term",
        value: [],
      },
    },
    qr_settings: {
      create: {
        value: "",
        ec_level: "M",
        enable_CORS: true,
        size: 220,
        quiet_zone: 10,
        bg_color: "rgba(255,255,255,1)",
        fg_color: "rgba(0,0,0,1)",
        logo_image: "",
        logo_width: 60,
        logo_height: 60,
        logo_opacity: 1.0,
        remove_qr_code_behind_logo: true,
        logo_padding: 0,
        logo_padding_style: "square",
        top_l_eye_radius: [0, 0, 0, 0],
        top_r_eye_radius: [0, 0, 0, 0],
        bottom_l_eye_radius: [0, 0, 0, 0],
        eye_color: "rgba(0,0,0,1)",
        qr_style: "squares",
        qr_type: "png",
        x_parent: false,
      },
    },
    wifi_settings: {
      create: {
        ssid: {
          create: {
            label: "SSID",
            tooltip: "The name of the WiFi network",
            aria_label: "Enter the name of the WiFi network",
            error: "Please enter a valid SSID",
            value: "",
          },
        },
        password: {
          create: {
            label: "Password",
            tooltip: "The password for the WiFi network",
            aria_label: "Enter the password for the WiFi network",
            error: "Please enter a valid password",
            value: "",
          },
        },
        encryption: {
          create: {
            label: "Security",
            tooltip: "The security type of the WiFi network",
            aria_label: "Select the security type of the WiFi network",
            error: "Please select a valid security type",
            value: "WPA2",
          },
        },
        hidden: {
          create: {
            label: "Hidden Network",
            tooltip: "Is the WiFi network hidden?",
            aria_label: "Is the WiFi network hidden?",
            error: "Please select a valid option",
            value: false,
          },
        },
      },
    },
    link_history: {
      create: {
        utm_links: [],
        wifi_links: [],
      },
    },
  };
  const user = await prisma.user
    .create({
      data: data,
    })
    .then((response) => {
      async () => {
        await prisma.$disconnect();
      };
      return response;
    })
    .catch(async (e) => {
      logger.error(e);
      await prisma.$disconnect();
    });
  return user;
}

/**
 *
 * @param string payload
 * @returns
 */
export async function lookupUser(payload, logger) {
  const username = payload;
  logger.log("Looking up username", username);
  let localUserExists = false;
  const exists = await prisma.user
    .findUnique({
      relationLoadStrategy: "join",
      include: {
        licensing: true,
        qr_settings: true,
        main_settings: true,
        bitly_settings: true,
        utm_campaign: true,
        utm_keyword: true,
        utm_content: true,
        utm_medium: true,
        utm_source: true,
        utm_target: true,
        utm_term: true,
        wifi_settings: true,
        link_history: true,
      },
      where: {
        login: username,
      },
    })
    .then((user) => {
      if (user) {
        localUserExists = true;
      } else {
        logger.log("User Does Not Exist");
      }
      return user;
    })
    .catch((error) => {
      logger.log("Error: ", error);
      return error;
    });
  async () => {
    await prisma.$disconnect();
  };
  if (localUserExists) {
    return exists;
  } else {
    return null;
  }
}

/**
 * lookup a user by email and username
 * @param string payload
 * @returns
 */
export async function lookupUserByEmail(payload, logger) {
  logger.log("Looking up user", payload.username, payload.email);
  let localUserExists = false;
  const exists = await prisma.user
    .findUnique({
      relationLoadStrategy: "join",
      include: {
        licensing: true,
      },
      where: {
        login: payload.username,
        email: payload.email,
      },
    })
    .then((user) => {
      localUserExists = user !== null;
      return user;
    })
    .catch((error) => {
      logger.log("Error: ", error);
      return error;
    });
  if (localUserExists) {
    return exists;
  } else {
    return null;
  }
}

/**
 * lookup customer by Stripe customer ID
 * @param string payload
 * @returns
 */
export async function lookupStripeCustomer(payload, logger) {
  let localUserExists = false;
  const exists = await prisma.user
    .findMany({
      relationLoadStrategy: "join",
      include: {
        licensing: true,
      },
      where: {
        stripe_id: payload,
      },
    })
    .then((user) => {
      localUserExists = user !== null;
      return user;
    })
    .catch((error) => {
      logger.log("Error: ", error);
      return error;
    });
  if (localUserExists) {
    return exists;
  } else {
    return null;
  }
}

/**
 * Lookup user by Keygen.sh id
 * @param string payload
 * @returns
 */
export async function lookupKeygenUser(payload, logger) {
  let localUserExists = false;
  const exists = await prisma.user
    .findMany({
      relationLoadStrategy: "join",
      include: {
        licensing: true,
      },
      where: {
        keygen_id: payload,
      },
    })
    .then((user) => {
      localUserExists = user !== null;
      return user;
    })
    .catch((error) => {
      logger.log("Error: ", error);
      return error;
    });
  if (localUserExists) {
    return exists;
  } else {
    const kg = await createKeygenAccount(payload, logger);
    return null;
  }
}