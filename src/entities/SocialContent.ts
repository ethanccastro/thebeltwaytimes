import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { SocialUser } from './SocialUser';

@Entity({ tableName: 'socialcontent' })
export class SocialContent {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'UUID()' })
  socialcontent_rowguid!: string;

  @ManyToOne(() => SocialUser, { fieldName: 'socialcontent_socialuserrowguid' })
  socialuser!: SocialUser;

  @Property({ fieldName: 'socialcontent_text', type: 'text' })
  socialcontent_text!: string;

  @Property({ fieldName: 'socialcontent_source', nullable: true, length: 255 })
  socialcontent_source?: string;

  @Property({ fieldName: 'socialcontent_postedat', onCreate: () => new Date() })
  socialcontent_postedat: Date = new Date();
}
